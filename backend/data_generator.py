import asyncio
import random
from datetime import datetime
from sqlalchemy.orm import Session
import crud, schemas, models
from database import SessionLocal
from ml_model import anomaly_detector

is_simulating = False

# State trackers for each machine ID
machine_states = {}

def get_base_power(name, state):
    if "Laptop" in name: # Student Laptop
        return random.uniform(20.0, 60.0) if state == "Active" else random.uniform(1.0, 5.0)
    elif "Charger" in name: # Phone Charger
        return random.uniform(10.0, 15.0) if state == "Active" else 0.0
    elif "Desktop" in name: # Office Desktop
        return random.uniform(100.0, 200.0) if state == "Active" else random.uniform(5.0, 10.0)
    return 10.0

async def generate_sensor_data_loop():
    global is_simulating
    while True:
        if is_simulating:
            db: Session = SessionLocal()
            try:
                machines = crud.get_machines(db)
                if not machines:
                    # If no machines exist, create mock personas
                    mock_machines = [
                        {"name": "Student-Laptop-01", "location": "Dorm Room A"},
                        {"name": "Phone-Charger-01", "location": "Dorm Room A"},
                        {"name": "Office-Desktop-01", "location": "Manager Office"},
                        {"name": "Office-Desktop-02", "location": "Reception"}
                    ]
                    for m in mock_machines:
                        crud.create_machine(db, schemas.MachineCreate(**m))
                    machines = crud.get_machines(db)

                for machine in machines:
                    # Initialize state tracker if not exists
                    if machine.id not in machine_states:
                        machine_states[machine.id] = {"state": "Active", "idle_duration": 0}
                    
                    # Randomly switch states
                    tracker = machine_states[machine.id]
                    if random.random() < 0.1: # 10% chance to switch state
                        tracker["state"] = "Idle" if tracker["state"] == "Active" else "Active"
                        tracker["idle_duration"] = 0 # reset idle duration
                    
                    # Increment idle duration
                    if tracker["state"] == "Idle":
                        tracker["idle_duration"] += 5 # we run every 5 seconds
                    
                    # Base conditions
                    voltage = random.uniform(220.0, 240.0)
                    base_power = get_base_power(machine.name, tracker["state"])
                    current = base_power / voltage
                    temp = random.uniform(30.0, 45.0)
                    vib = random.uniform(0.1, 0.5)

                    # Simulate Anomalies
                    if random.random() < 0.05: # 5% chance of anomaly
                        if tracker["state"] == "Idle":
                            if "Charger" in machine.name:
                                # Phantom Load (charger left plugged in, drawing power)
                                current = random.uniform(5.0, 8.0) / voltage 
                                tracker["idle_duration"] += 300 # fake long idle
                            else:
                                # Hidden Leak (e.g. background crypto miner)
                                current = random.uniform(50.0, 100.0) / voltage
                                tracker["idle_duration"] += 60 # fake idle
                        else:
                            # Inefficiency Spike during active
                            current *= random.uniform(2.0, 3.5)
                            temp *= random.uniform(1.2, 1.5)

                    power = voltage * current

                    sensor_data = schemas.SensorDataCreate(
                        machine_id=machine.id,
                        voltage=round(voltage, 2),
                        current=round(current, 2),
                        power_consumption=round(power, 2),
                        temperature=round(temp, 2),
                        vibration=round(vib, 2),
                        state=tracker["state"],
                        idle_duration=tracker["idle_duration"],
                        timestamp=datetime.utcnow()
                    )

                    # Save to DB
                    db_sensor = crud.create_sensor_data(db, sensor_data)

                    # Predict Anomaly
                    data_point = {
                        "power_consumption": db_sensor.power_consumption,
                        "idle_duration": db_sensor.idle_duration,
                        "state": db_sensor.state
                    }
                    
                    is_anomaly, score, a_type, msg, rec = anomaly_detector.predict(data_point)
                    
                    if is_anomaly:
                        anomaly_log = schemas.AnomalyLogCreate(
                            machine_id=machine.id,
                            anomaly_score=score,
                            is_anomaly=True,
                            anomaly_type=a_type,
                            alert_message=msg,
                            recommendation=rec,
                            timestamp=db_sensor.timestamp
                        )
                        crud.create_anomaly_log(db, anomaly_log)
                        print(f"🚨 Anomaly Detected on Machine {machine.name}! Score: {score}, Type: {a_type}")

            except Exception as e:
                print(f"Error in data generation loop: {e}")
            finally:
                db.close()
        
        # Wait 5 seconds before generating next batch
        await asyncio.sleep(5)

def toggle_simulation(state: bool):
    global is_simulating
    is_simulating = state
    return is_simulating
