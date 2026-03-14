import pandas as pd
import sqlite3
import os
from ml_model import anomaly_detector

def main():
    db_path = "energy_db.sqlite3"
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    try:
        query = "SELECT power_consumption, idle_duration FROM sensor_data LIMIT 10000"
        df = pd.read_sql_query(query, conn)
        
        if len(df) >= 10:
            success, msg = anomaly_detector.train(df)
            print(f"Train result: {success}, Message: {msg}")
        else:
            print(f"Not enough data in DB. Only {len(df)} records found.")
    except Exception as e:
        print("Error:", e)
        # try the other table name
        try:
            query = "SELECT power_consumption, idle_duration FROM sensordata LIMIT 10000"
            df = pd.read_sql_query(query, conn)
            if len(df) >= 10:
                success, msg = anomaly_detector.train(df)
                print(f"Train result: {success}, Message: {msg}")
            else:
                print(f"Not enough data in DB. Only {len(df)} records found.")
        except Exception as inner_e:
            print("Inner error:", inner_e)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
