from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas
from datetime import datetime, timedelta

def get_machine(db: Session, machine_id: int):
    return db.query(models.Machine).filter(models.Machine.id == machine_id).first()

def get_machines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Machine).offset(skip).limit(limit).all()

def create_machine(db: Session, machine: schemas.MachineCreate):
    db_machine = models.Machine(name=machine.name, location=machine.location)
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

def get_sensor_data(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.SensorData).order_by(desc(models.SensorData.timestamp)).offset(skip).limit(limit).all()

def create_sensor_data(db: Session, sensor_data: schemas.SensorDataCreate):
    db_sensor_data = models.SensorData(
        machine_id=sensor_data.machine_id,
        voltage=sensor_data.voltage,
        current=sensor_data.current,
        power_consumption=sensor_data.power_consumption,
        temperature=sensor_data.temperature,
        vibration=sensor_data.vibration,
        state=sensor_data.state,
        idle_duration=sensor_data.idle_duration,
        timestamp=sensor_data.timestamp or datetime.utcnow()
    )
    db.add(db_sensor_data)
    db.commit()
    db.refresh(db_sensor_data)
    return db_sensor_data

def get_anomaly_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AnomalyLog).order_by(desc(models.AnomalyLog.timestamp)).offset(skip).limit(limit).all()

def create_anomaly_log(db: Session, anomaly_log: schemas.AnomalyLogCreate):
    db_anomaly_log = models.AnomalyLog(
        machine_id=anomaly_log.machine_id,
        anomaly_score=anomaly_log.anomaly_score,
        is_anomaly=anomaly_log.is_anomaly,
        anomaly_type=anomaly_log.anomaly_type,
        alert_message=anomaly_log.alert_message,
        recommendation=anomaly_log.recommendation,
        timestamp=anomaly_log.timestamp or datetime.utcnow()
    )
    db.add(db_anomaly_log)
    db.commit()
    db.refresh(db_anomaly_log)
    return db_anomaly_log

def get_recent_sensor_data_for_training(db: Session, limit: int = 10000):
    # Fetch recent data for training the ML model
    return db.query(models.SensorData).order_by(desc(models.SensorData.timestamp)).limit(limit).all()

def get_latest_data_per_machine(db: Session):
    machines = get_machines(db)
    insights = []
    
    for machine in machines:
        # Get latest sensor data
        latest_sensor = db.query(models.SensorData).filter(models.SensorData.machine_id == machine.id).order_by(desc(models.SensorData.timestamp)).first()
        
        # Get latest anomaly log
        latest_anomaly = db.query(models.AnomalyLog).filter(models.AnomalyLog.machine_id == machine.id).order_by(desc(models.AnomalyLog.timestamp)).first()
        
        insights.append({
            "machine": {
                "id": machine.id,
                "name": machine.name,
                "location": machine.location
            },
            "sensor_data": latest_sensor,
            "anomaly_data": latest_anomaly
        })
        
    return insights
