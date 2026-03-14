from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import asyncio

import models, schemas, crud
from database import engine, get_db
from ml_model import anomaly_detector
import data_generator

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Energy Leak Detection API")

# Add CORS Middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start background data generation task on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(data_generator.generate_sensor_data_loop())

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Energy Leak Detection System"}

@app.get("/machines", response_model=List[schemas.Machine])
def read_machines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    machines = crud.get_machines(db, skip=skip, limit=limit)
    return machines

@app.get("/sensor-data", response_model=List[schemas.SensorData])
def read_sensor_data(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    data = crud.get_sensor_data(db, skip=skip, limit=limit)
    return data

@app.get("/anomalies", response_model=List[schemas.AnomalyLog])
def read_anomalies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = crud.get_anomaly_logs(db, skip=skip, limit=limit)
    return logs

@app.post("/train-model")
def train_detection_model(db: Session = Depends(get_db)):
    data = crud.get_recent_sensor_data_for_training(db, limit=10000)
    if not data:
        raise HTTPException(status_code=400, detail="No data available for training.")
    
    # Convert to dataframe
    df_data = [{
        "voltage": d.voltage,
        "current": d.current,
        "power_consumption": d.power_consumption,
        "temperature": d.temperature,
        "vibration": d.vibration
    } for d in data]
    
    df = pd.DataFrame(df_data)
    success, message = anomaly_detector.train(df)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

@app.post("/predict")
def predict_anomaly(data_point: schemas.SensorDataBase):
    is_anomaly, score, a_type, msg, rec = anomaly_detector.predict(data_point.dict(exclude={"machine_id"}))
    return {"is_anomaly": is_anomaly, "anomaly_score": score, "anomaly_type": a_type, "alert_message": msg, "recommendation": rec}

@app.get("/insights")
def get_insights(db: Session = Depends(get_db)):
    """
    Returns the latest sensor readings and anomaly statuses for all machines,
    formatted for the React frontend dashboard.
    """
    return crud.get_latest_data_per_machine(db)

@app.post("/start-simulation")
def toggle_data_generation(state: bool):
    """
    Toggle the background data simulation.
    Pass `state=true` in query params or body to enable.
    """
    is_simulating = data_generator.toggle_simulation(state)
    status = "running" if is_simulating else "stopped"
    return {"message": f"Data generation is now {status}"}
