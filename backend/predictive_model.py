import pandas as pd
import numpy as np
from datetime import datetime

def generate_forecast(sensor_data_records):
    """
    Analyzes historical sensor data for a machine to predict a Health Score
    and estimated days to failure (RUL - Remaining Useful Life).
    
    sensor_data_records: List of models.SensorData objects
    """
    if not sensor_data_records:
        return 100.0, 365, False
        
    df = pd.DataFrame([{
        "timestamp": r.timestamp,
        "temperature": r.temperature,
        "vibration": r.vibration,
        "power": r.power_consumption
    } for r in sensor_data_records])
    
    df = df.sort_values(by="timestamp")
    
    # Use recent data for health check
    recent_data = df.tail(100)
    
    avg_temp = recent_data["temperature"].mean()
    avg_vib = recent_data["vibration"].mean()
    
    # Heuristics for penalty: 
    # Assume ideal temp is < 65C, ideal vibration is < 5 mm/s
    temp_penalty = max(0, (avg_temp - 65) * 2.0)
    vib_penalty = max(0, (avg_vib - 5) * 4.0)
    
    health_score = max(0.0, 100.0 - temp_penalty - vib_penalty)
    
    # If it's bouncing around a lot, lower the health
    temp_std = recent_data["temperature"].std()
    vib_std = recent_data["vibration"].std()
    
    if pd.notna(temp_std) and temp_std > 10:
        health_score -= 5
    if pd.notna(vib_std) and vib_std > 3:
        health_score -= 10
        
    health_score = np.clip(health_score, 0.0, 100.0)
    
    # Estimate days to failure
    # A simple exponential decay mapping: health 100 -> ~365 days, health 50 -> ~30 days
    if health_score > 90:
        estimated_days = 300 + int(health_score)
    elif health_score > 70:
        estimated_days = 90 + int(health_score)
    elif health_score > 50:
        estimated_days = 30 + int(health_score / 2)
    else:
        estimated_days = max(1, int(health_score / 2))
        
    needs_maintenance = health_score < 65.0 or estimated_days < 14
    
    return round(health_score, 1), estimated_days, needs_maintenance
