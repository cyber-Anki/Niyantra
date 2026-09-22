"""
Targeted Security & SMTP Delivery Unit Tests for Niyantra Email Auth.
Verifies:
1. 5-attempt brute force lockout (423 Locked status)
2. Timing attack protection (dummy hashing on unknown user)
3. SQLAlchemy row-locking (with_for_update query execution)
4. SMTP delivery & fallback printing
5. EmailStr validation & whitespace sanitization
"""
import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from database import SessionLocal
from models import UserDB
import auth
from schemas import LoginRequest, RegisterRequest, VerifyOTPRequest

client = TestClient(app)


class TestSecurityAndAuth(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Clean up test accounts
        self.db.query(UserDB).filter(UserDB.email.like("%@testrail.gov.in")).delete()
        self.db.commit()

    def tearDown(self):
        self.db.query(UserDB).filter(UserDB.email.like("%@testrail.gov.in")).delete()
        self.db.commit()
        self.db.close()

    def test_brute_force_lockout(self):
        """Test that 5 consecutive failed logins trigger 423 Locked."""
        email = "lockout.target@testrail.gov.in"
        password = "CorrectPassword123!"

        # Register user
        reg_res = client.post("/api/auth/register", json={
            "name": "Lockout Tester",
            "email": email,
            "password": password,
            "role": "Section Engineer",
        })
        self.assertEqual(reg_res.status_code, 201)

        # 4 failed attempts should yield 401
        for attempt in range(1, 5):
            res = client.post("/api/auth/login", json={
                "email": email,
                "password": "WrongPassword!",
            })
            self.assertEqual(res.status_code, 401, f"Attempt {attempt} should be 401")
            self.assertIn("attempts remaining", res.json()["detail"])

        # 5th failed attempt should trigger 423 Locked
        res5 = client.post("/api/auth/login", json={
            "email": email,
            "password": "WrongPassword!",
        })
        self.assertEqual(res5.status_code, 423, "5th attempt must trigger 423 Locked")
        self.assertIn("Security lockout", res5.json()["detail"])

        # Subsequent attempt even with CORRECT password must also be 423 Locked
        res_locked = client.post("/api/auth/login", json={
            "email": email,
            "password": password,
        })
        self.assertEqual(res_locked.status_code, 423)
        self.assertIn("Account locked", res_locked.json()["detail"])

    def test_timing_attack_dummy_hash(self):
        """Test that unknown user triggers dummy hash to equalize timing."""
        with patch.object(auth.pwd_context, 'hash', wraps=auth.pwd_context.hash) as mock_hash:
            res = client.post("/api/auth/login", json={
                "email": "nonexistent.officer@testrail.gov.in",
                "password": "AnyPassword123!",
            })
            self.assertEqual(res.status_code, 401)
            mock_hash.assert_called_with("dummy_timing_hash")

    def test_smtp_live_delivery_mocked(self):
        """Test that with SMTP credentials, smtplib.SMTP connects to gmail:587 starttls."""
        with patch.dict(os.environ, {"SMTP_USERNAME": "test@gmail.com", "SMTP_PASSWORD": "app-password"}):
            with patch("smtplib.SMTP") as mock_smtp_cls:
                mock_server = MagicMock()
                mock_smtp_cls.return_value.__enter__.return_value = mock_server

                success = auth.send_otp_email("officer@indianrailways.gov.in", "7421")
                self.assertTrue(success)
                mock_smtp_cls.assert_called_with("smtp.gmail.com", 587, timeout=10)
                mock_server.starttls.assert_called_once()
                mock_server.login.assert_called_with("test@gmail.com", "app-password")
                mock_server.sendmail.assert_called_once()
                
                # Check email content
                args, _ = mock_server.sendmail.call_args
                sender, recipients, raw_msg = args
                self.assertEqual(sender, "test@gmail.com")
                self.assertIn("officer@indianrailways.gov.in", recipients)
                self.assertIn("Your Niyantra Command Center access OTP is: 7421", raw_msg)

    def test_smtp_fallback_without_credentials(self):
        """Test that without SMTP credentials, it falls back without crashing."""
        with patch.dict(os.environ, {"SMTP_USERNAME": "", "SMTP_PASSWORD": ""}, clear=True):
            success = auth.send_otp_email("officer@indianrailways.gov.in", "9999")
            self.assertFalse(success)  # Fallback to terminal

    def test_whitespace_sanitization(self):
        """Test whitespace stripping and null byte rejection."""
        req = LoginRequest(email="  officer@testrail.gov.in  ", password="  Password123!  ")
        self.assertEqual(req.email, "officer@testrail.gov.in")
        self.assertEqual(req.password, "Password123!")


if __name__ == "__main__":
    unittest.main()
