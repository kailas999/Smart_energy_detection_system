from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class MachineBase(BaseModel):
    name: str
    location: str

class MachineCreate(MachineBase):
    pass

class Machine(MachineBase):
    id: int

    class Config:
        from_attributes = True

class SensorDataBase(BaseModel):
    machine_id: int
    voltage: float
    current: float
    power_consumption: float
    temperature: float
    vibration: float
    state: str
    idle_duration: float

class SensorDataCreate(SensorDataBase):
    timestamp: Optional[datetime] = None

class SensorData(SensorDataBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class AnomalyLogBase(BaseModel):
    machine_id: int
    anomaly_score: float
    is_anomaly: bool
    anomaly_type: Optional[str] = None
    alert_message: Optional[str] = None
    recommendation: Optional[str] = None

class AnomalyLogCreate(AnomalyLogBase):
    timestamp: Optional[datetime] = None

class AnomalyLog(AnomalyLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
