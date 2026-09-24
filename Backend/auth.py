"""
Production Authentication Module for Niyantra.
Provides password hashing via bcrypt, JWT token signing/verification,
live 2FA/OTP email delivery via SMTP with graceful fallback, row-level locking,
timing-attack protection, and secure brute-force lockout protections.
"""
import os
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import UserDB
from schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfile,
    VerifyOTPRequest,
)

# Configuration from Environment Variables
SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-niyantran-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Security Constants
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# In-memory OTP storage for 2FA workflow (email -> 4-digit code)
OTP_STORE: dict[str, str] = {}

auth_router = APIRouter()


# --- Security Utilities ---

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against its bcrypt hash (with plaintext dev fallback)."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return plain_password == hashed_password


class PasswordContext:
    @staticmethod
    def hash(secret: str) -> str:
        return hash_password(secret)

    @staticmethod
    def verify(plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)


pwd_context = PasswordContext()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed cryptographic JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends a 2FA OTP email via SMTP (smtp.gmail.com:587 with starttls) if credentials exist.
    Falls back gracefully to terminal printing if no credentials or if delivery fails.
    """
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    subject = "Niyantra Command Center Access OTP"
    body = f"Your Niyantra Command Center access OTP is: {otp}"

    if smtp_username and smtp_password:
        try:
            msg = MIMEText(body, "plain")
            msg["Subject"] = subject
            msg["From"] = smtp_username
            msg["To"] = to_email

            with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, [to_email], msg.as_string())
            print(f"[SMTP] Live OTP email successfully delivered to {to_email}")
            return True
        except Exception as e:
            print(f"[SMTP WARNING] Failed to send email via SMTP to {to_email}: {e}")
            print(f"\n{'='*50}\n[FALLBACK OTP] TERMINAL DELIVERY TO {to_email}:\n{body}\n{'='*50}\n")
            return False
    else:
        print(f"\n{'='*50}\n[OTP] TERMINAL FALLBACK TO {to_email} (SMTP credentials not configured):\n{body}\n{'='*50}\n")
        return False


# --- Authentication Dependency & Verification Logic ---

def authenticate_user(db: Session, req: LoginRequest) -> UserDB:
    """
    Validates user credentials against UserDB with:
    1. Race-Condition Protection: Row locking via with_for_update()
    2. Timing-Attack Protection: Dummy timing hash
    3. Brute-Force Protection: 5-attempt lockout for 15 minutes
    """
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Race-Condition Protection: Lock the row during auth to prevent concurrent bypass
    user = db.query(UserDB).with_for_update().filter(UserDB.email == req.email).first()

    if not user:
        # 2. Timing-Attack Protection: Equalize response times
        pwd_context.hash("dummy_timing_hash")
        raise generic_error

    now = datetime.now(timezone.utc)

    # 3. Check Active Lockout
    if user.lockout_until:
        lockout_time = user.lockout_until if user.lockout_until.tzinfo else user.lockout_until.replace(tzinfo=timezone.utc)
        if lockout_time > now:
            remaining_mins = max(1, int((lockout_time - now).total_seconds() // 60))
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked. Try again in {remaining_mins} minute(s)."
            )

    # 4. Verify Password
    if not verify_password(req.password, user.hashed_password):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.lockout_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Security lockout for {LOCKOUT_MINUTES} minutes due to excessive failures."
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials. {MAX_FAILED_ATTEMPTS - user.failed_attempts} attempts remaining."
        )

    # 5. Success: Reset lockout counters
    user.failed_attempts = 0
    user.lockout_until = None
    user.last_login_at = now
    db.commit()
    db.refresh(user)
    return user


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> UserDB:
    """
    FastAPI dependency to protect endpoints.
    Extracts Bearer token, validates signature/expiration, and fetches UserDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[UserDB]:
    """Optional user dependency for endpoints that accept both auth and public callers."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None


# --- Router Endpoints ---

@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new officer/engineer and generates a 4-digit verification OTP."""
    existing = db.query(UserDB).filter(UserDB.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered",
        )

    hashed_pw = hash_password(req.password)
    new_user = UserDB(
        full_name=req.name,
        email=req.email,
        hashed_password=hashed_pw,
        role=req.role,
        department=req.department or "ENG",
        division=req.division or "Delhi (DLI)",
        section_zone=req.division or "Delhi (DLI)",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    otp = str(random.randint(1000, 9999))
    OTP_STORE[req.email] = otp
    send_otp_email(req.email, otp)
    return {
        "status": "success",
        "message": f"Registered successfully. OTP sent to {req.email}.",
    }


@auth_router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Validates user credentials, enforces brute-force lockout, and issues 2FA OTP via email."""
    user = authenticate_user(db, req)

    otp = str(random.randint(1000, 9999))
    OTP_STORE[user.email] = otp
    send_otp_email(user.email, otp)
    return {
        "status": "success",
        "message": f"Credentials verified. OTP sent to {user.email}.",
    }


@auth_router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies the 2FA OTP and issues a cryptographically signed JWT access token."""
    stored_otp = OTP_STORE.get(req.email)
    if not stored_otp or stored_otp != req.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )

    # Invalidate one-time password
    del OTP_STORE[req.email]

    user = db.query(UserDB).filter(UserDB.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User record not found")

    token_data = {
        "sub": user.email,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "department": user.department or "ENG",
    }
    access_token = create_access_token(data=token_data)

    user_profile = {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "role": user.role,
        "department": user.department or "ENG",
        "division": user.division or "Delhi (DLI)",
        "corridor": "NDLS-GZB",
    }

    return {
        "status": "success",
        "access_token": access_token,
        "token": access_token,  # Backward compatibility
        "token_type": "bearer",
        "user": user_profile,
    }


@auth_router.get("/me")
def get_current_user_profile(current_user: UserDB = Depends(get_current_user)):
    """Returns the profile of the currently authenticated officer."""
    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department or "ENG",
        "division": current_user.division or "Delhi (DLI)",
        "corridor": "NDLS-GZB",
    }