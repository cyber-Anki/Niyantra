"""
End-to-End Verification Test for Niyantra Production Merge.
Tests:
- Public endpoints (/health, /api/data/bootstrap)
- Auth flow (Register -> Login -> Verify OTP -> JWT Generation -> /api/auth/me)
- Protected route enforcement (/api/blocks/decide: 401 without token, 200 with Bearer token)
- ML Model and Optimizer integration
"""
import sys
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models import UserDB, ScheduledBlockDB

# Create fresh schema tables
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def run_tests():
    print("=== 1. Testing Public Endpoints ===")
    r_health = client.get("/health")
    assert r_health.status_code == 200, f"/health failed: {r_health.status_code} {r_health.text}"
    health_data = r_health.json()
    print("Health response:", health_data)
    assert health_data["status"] == "ok"
    assert "model_loaded" in health_data

    r_boot = client.get("/api/data/bootstrap")
    assert r_boot.status_code == 200, f"/api/data/bootstrap failed: {r_boot.status_code}"
    boot_data = r_boot.json()
    assert "tasks" in boot_data and "corridors" in boot_data
    print(f"Bootstrap verified: {len(boot_data['tasks'])} tasks, {len(boot_data['corridors'])} corridors loaded.")

    print("\n=== 2. Testing Authentication Endpoints ===")
    test_email = "officer.sharma@railways.gov.in"
    test_pass = "SecurePass2026!"

    # Clean up test user if exists
    db = SessionLocal()
    existing = db.query(UserDB).filter(UserDB.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()
    db.close()

    # Register
    r_reg = client.post("/api/auth/register", json={
        "name": "Rajesh Sharma",
        "email": test_email,
        "password": test_pass,
        "role": "Section Engineer",
        "department": "ENG",
        "division": "Delhi (DLI)"
    })
    assert r_reg.status_code == 201, f"Register failed: {r_reg.status_code} {r_reg.text}"
    reg_data = r_reg.json()
    print("Registration response:", reg_data)
    assert reg_data["status"] == "success"
    otp = reg_data["dev_otp"]
    assert len(otp) == 4

    # Verify OTP
    r_verify = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": otp
    })
    assert r_verify.status_code == 200, f"Verify OTP failed: {r_verify.status_code} {r_verify.text}"
    verify_data = r_verify.json()
    token = verify_data["access_token"]
    assert token and len(token) > 20
    print("JWT Token received:", token[:30] + "...")
    assert verify_data["user"]["email"] == test_email

    # /api/auth/me with Bearer token
    r_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200, f"/api/auth/me failed: {r_me.status_code} {r_me.text}"
    me_data = r_me.json()
    assert me_data["name"] == "Rajesh Sharma"
    print("/api/auth/me verified:", me_data)

    # Test Login
    r_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_pass
    })
    assert r_login.status_code == 200
    login_otp = r_login.json()["dev_otp"]
    print("Login OTP issued:", login_otp)

    # Re-verify login OTP
    r_verify2 = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": login_otp
    })
    assert r_verify2.status_code == 200
    token2 = r_verify2.json()["access_token"]

    print("\n=== 3. Testing Protected Endpoints ===")
    # Seed a block for decision test
    db = SessionLocal()
    test_block = db.get(ScheduledBlockDB, "TEST-BLOCK-01")
    if not test_block:
        test_block = ScheduledBlockDB(
            block_id="TEST-BLOCK-01",
            corridor_id="NDLS-GZB-01",
            section="NDLS-GZB",
            start_minute=60,
            end_minute=180,
            task_ids=["T01", "T02"],
            departments=["ENG"],
            status="pending"
        )
        db.add(test_block)
        db.commit()
    db.close()

    # Attempt to decide block WITHOUT token -> MUST be 401
    r_unauth = client.post("/api/blocks/decide", json={
        "block_id": "TEST-BLOCK-01",
        "action": "approve"
    })
    print("Unauthenticated /api/blocks/decide response status:", r_unauth.status_code)
    assert r_unauth.status_code == 401, f"Expected 401 Unauthorized, got {r_unauth.status_code}"

    # Attempt to decide block WITH token -> MUST be 200 and attribute to Rajesh Sharma
    r_auth = client.post(
        "/api/blocks/decide",
        json={"block_id": "TEST-BLOCK-01", "action": "approve"},
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert r_auth.status_code == 200, f"Authenticated decide failed: {r_auth.status_code} {r_auth.text}"
    auth_data = r_auth.json()
    print("Authenticated decide response:", auth_data)
    assert auth_data["status"] == "approved"

    print("\n=== 4. Testing ML and Optimization Integration ===")
    # System 1 prioritization
    r_prio = client.post("/api/system1/prioritize", json={"tasks": boot_data["tasks"][:5]})
    assert r_prio.status_code == 200, f"Prioritize failed: {r_prio.status_code} {r_prio.text}"
    prio_data = r_prio.json()
    assert len(prio_data["tasks"]) == 5
    print("System 1 risk scores verified. Top task risk:", prio_data["tasks"][0]["risk_score"])

    # System 2 optimizer
    r_opt = client.post("/api/system2/optimize-weekly", json={
        "tasks": boot_data["tasks"][:8],
        "corridors": boot_data["corridors"][:3],
        "week_start": "2025-04-14"
    })
    assert r_opt.status_code == 200, f"Optimize weekly failed: {r_opt.status_code} {r_opt.text}"
    opt_data = r_opt.json()
    print(f"System 2 verified: Scheduled {len(opt_data['scheduled_blocks'])} blocks, cleared risk: {opt_data['total_risk_cleared']}")

    print("\n=======================================================")
    print(">>> ALL PRODUCTION MERGE TESTS PASSED SUCCESSFULLY! <<<")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
