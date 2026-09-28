import os
import pandas as pd
from datetime import datetime, timedelta, timezone
from database import SessionLocal, engine, Base
from models import UserDB, TrackSectionDB, TrackDefectDB, ScheduledBlockDB, TrainScheduleDB
from auth import hash_password
import uuid

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing to ensure idempotency for our test, or we can just check
    if db.query(TrackSectionDB).first():
        print("Data already exists. Skipping injection.")
        print("If you want to re-seed, drop the tables first.")
        
        print(f"TrackSectionDB rows: {db.query(TrackSectionDB).count()}")
        print(f"TrackDefectDB rows: {db.query(TrackDefectDB).count()}")
        print(f"TrainScheduleDB rows: {db.query(TrainScheduleDB).count()}")
        print(f"UserDB rows: {db.query(UserDB).count()}")
        
        db.close()
        return

    data_dir = os.path.join(os.path.dirname(__file__), "data")
    
    # Try to load CSVs if they exist
    ops_csv = os.path.join(data_dir, "Operations_of_Indian_Railways.csv")
    trains_csv = os.path.join(data_dir, "trains.csv")
    
    if os.path.exists(ops_csv):
        print("Found Operations_of_Indian_Railways.csv. Loading data...")
        df_ops = pd.read_csv(ops_csv)
        for idx, row in df_ops.head(10).iterrows():
            sec = TrackSectionDB(
                section_code=f"NDAP-SEC-{idx}", corridor=str(row.get("Zone/Division", "Northern Railway")),
                gmt_load=float(row.get("Goods_Traffic_MT", 45.0)), speed_kmh=110.0,
                tgi_score=80.0, sleeper_density=1540, ballast_cushion_mm=250
            )
            db.add(sec)
        db.commit()
    else:
        print("CSV files not found in Backend/data/. Using Indian Railways baseline data as fallback...")
        
        # Track Sections Fallback
        sections = [
            TrackSectionDB(
                section_code="SEC-NDLS-GZB-01", corridor="NDLS-GZB",
                gmt_load=65.4, speed_kmh=130.0, tgi_score=85.5, sleeper_density=1660, ballast_cushion_mm=300
            ),
            TrackSectionDB(
                section_code="SEC-NZM-MTJ-03", corridor="NZM-MTJ",
                gmt_load=80.2, speed_kmh=160.0, tgi_score=92.0, sleeper_density=1660, ballast_cushion_mm=350
            )
        ]
        db.add_all(sections)
        db.commit()

        sec_ndls = db.query(TrackSectionDB).filter_by(section_code="SEC-NDLS-GZB-01").first()
        sec_nzm = db.query(TrackSectionDB).filter_by(section_code="SEC-NZM-MTJ-03").first()

        # Track Defects Fallback
        defects = [
            TrackDefectDB(
                section_id=sec_ndls.id, usfd_log_id="USFD-NDLS-001",
                defect_type="SQUAT", severity="IMR", chainage=14.8, stress_range_mpa=120.0,
                initial_crack_depth_mm=5.2, critical_crack_depth_mm=25.0, status="ACTIVE"
            ),
            TrackDefectDB(
                section_id=sec_nzm.id, usfd_log_id="USFD-NZM-002",
                defect_type="FRACTURE", severity="IMR", chainage=112.5, stress_range_mpa=140.0,
                initial_crack_depth_mm=8.4, critical_crack_depth_mm=25.0, status="ACTIVE"
            )
        ]
        db.add_all(defects)
        db.commit()

        # Train Schedules Fallback
        schedules = [
            TrainScheduleDB(
                train_number="12004", train_name="LKO SHTBDI EXP", train_category="PREMIER_PASSENGER", priority_weight=10.0,
                corridor="NDLS-GZB", origin_station="NDLS", destination_station="GZB",
                section_entry_time=datetime.utcnow(), section_exit_time=datetime.utcnow() + timedelta(minutes=45), avg_speed_kmh=110.0
            )
        ]
        db.add_all(schedules)
        db.commit()

    print("Injecting Engineering & Admin Personnel...")
    if not db.query(UserDB).filter_by(email="officialhelp7@gmail.com").first():
        test_user = UserDB(
            email="officialhelp7@gmail.com",
            full_name="Chief Engineer (Track)",
            hashed_password=hash_password("admin123"),
            role="DRM",
            department="ENG",
            division="Delhi (DLI)"
        )
        db.add(test_user)
        db.commit()

    print("Real-world Indian Railways data successfully injected into Supabase!")
    
    # Print summary
    print(f"TrackSectionDB rows: {db.query(TrackSectionDB).count()}")
    print(f"TrackDefectDB rows: {db.query(TrackDefectDB).count()}")
    print(f"TrainScheduleDB rows: {db.query(TrainScheduleDB).count()}")
    print(f"UserDB rows: {db.query(UserDB).count()}")
    db.close()

if __name__ == "__main__":
    seed_database()