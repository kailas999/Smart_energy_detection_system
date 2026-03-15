from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String)

    sensor_data = relationship("SensorData", back_populates="machine")
    anomaly_logs = relationship("AnomalyLog", back_populates="machine")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    voltage = Column(Float)
    current = Column(Float)
    power_consumption = Column(Float)
    temperature = Column(Float)
    vibration = Column(Float)
    state = Column(String) # E.g., Active, Idle, Offline
    idle_duration = Column(Float, default=0.0) # Seconds in idle state

    machine = relationship("Machine", back_populates="sensor_data")

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    anomaly_score = Column(Float)
    is_anomaly = Column(Boolean)
    anomaly_type = Column(String, nullable=True) # E.g., Hidden Leak, Phantom Load, Inefficiency Spike
    alert_message = Column(String, nullable=True) # Explainable alert
    recommendation = Column(String, nullable=True) # Actionable recommendation

    machine = relationship("Machine", back_populates="anomaly_logs")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="viewer") # admin, operator, viewer
    requires_password_change = Column(Boolean, default=True)

class MaintenanceForecast(Base):
    __tablename__ = "maintenance_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    health_score = Column(Float) # 0.0 to 100.0
    estimated_days_to_failure = Column(Integer)
    maintenance_recommended = Column(Boolean, default=False)
    
    machine = relationship("Machine")

