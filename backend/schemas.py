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

# --- Auth Schemas ---

class UserBase(BaseModel):
    username: str
    role: str = "viewer"

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    requires_password_change: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    requires_password_change: bool = False

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# --- Predictive Maintenance Schemas ---

class MaintenanceForecastBase(BaseModel):
    machine_id: int
    health_score: float
    estimated_days_to_failure: int
    maintenance_recommended: bool

class MaintenanceForecast(MaintenanceForecastBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Sustainability Schemas ---

class SustainabilityMetrics(BaseModel):
    carbon_footprint_kg: float
    energy_consumed_kwh: float
    tips: List[str]

# --- Voice Command Schemas ---

class VoiceCommandRequest(BaseModel):
    command: str

