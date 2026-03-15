from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
import pandas as pd
import asyncio

import models, schemas, crud, auth
from database import engine, get_db
from ml_model import anomaly_detector
import data_generator
import predictive_model
import llm_service
import tts_service

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
    # Create default admin if not exists
    db = next(get_db())
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        hashed_pw = auth.get_password_hash("admin123")
        admin = models.User(username="admin", hashed_password=hashed_pw, role="admin", requires_password_change=True)
        db.add(admin)
        db.commit()
    
    asyncio.create_task(data_generator.generate_sensor_data_loop())

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Energy Leak Detection System"}

# --- Auth Endpoints ---

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(login_request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # We will just use LoginRequest as the auth envelope
    # However it's cleaner to make a specific LoginRequest
    user = db.query(models.User).filter(models.User.username == login_request.username).first()
    if not user or not auth.verify_password(login_request.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "requires_password_change": user.requires_password_change
    }

@app.post("/api/auth/register", response_model=schemas.Token)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_pw = auth.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username,
        hashed_password=hashed_pw,
        role=user_in.role,
        requires_password_change=False
    )
    db.add(new_user)
    db.commit()
    
    access_token = auth.create_access_token(
        data={"sub": new_user.username, "role": new_user.role},
        expires_delta=auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "requires_password_change": False
    }

@app.post("/api/auth/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    current_user.requires_password_change = False
    db.commit()
    return {"message": "Password updated successfully"}

@app.get("/sensor-data", response_model=List[schemas.SensorData])
def read_sensor_data(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    data = crud.get_sensor_data(db, skip=skip, limit=limit)
    return data

@app.get("/anomalies", response_model=List[schemas.AnomalyLog])
def read_anomalies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = crud.get_anomaly_logs(db, skip=skip, limit=limit)
    return logs

@app.post("/train-model")
def train_detection_model(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
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
def predict_anomaly(data_point: schemas.SensorDataBase, current_user: models.User = Depends(auth.get_current_user)):
    is_anomaly, score, a_type, msg, rec = anomaly_detector.predict(data_point.dict(exclude={"machine_id"}))
    return {"is_anomaly": is_anomaly, "anomaly_score": score, "anomaly_type": a_type, "alert_message": msg, "recommendation": rec}

@app.get("/insights")
def get_insights(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns the latest sensor readings and anomaly statuses for all machines,
    formatted for the React frontend dashboard.
    """
    return crud.get_latest_data_per_machine(db)

@app.post("/start-simulation")
def toggle_data_generation(state: bool, current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    """
    Toggle the background data simulation.
    Pass `state=true` in query params or body to enable.
    """
    is_simulating = data_generator.toggle_simulation(state)
    status = "running" if is_simulating else "stopped"
    return {"message": f"Data generation is now {status}"}

@app.get("/api/forecast/{machine_id}", response_model=schemas.MaintenanceForecast)
def get_predictive_maintenance_forecast(machine_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    sensor_data = db.query(models.SensorData).filter(models.SensorData.machine_id == machine_id).order_by(models.SensorData.timestamp.desc()).limit(200).all()
    
    score, days, needs_maint = predictive_model.generate_forecast(sensor_data)
    
    forecast = models.MaintenanceForecast(
        machine_id=machine_id,
        health_score=score,
        estimated_days_to_failure=days,
        maintenance_recommended=needs_maint
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)
    return forecast

@app.get("/api/sustainability", response_model=schemas.SustainabilityMetrics)
def get_sustainability_metrics(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Very simple mock logic: grab all recent sensor data
    recent_data = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(1000).all()
    if not recent_data:
        return schemas.SustainabilityMetrics(carbon_footprint_kg=0.0, energy_consumed_kwh=0.0, tips=["Start the simulation to generate data."])
        
    # Assuming each data point represents average power over 5 seconds
    total_energy_kwh = sum([(d.power_consumption / 1000) * (5 / 3600) for d in recent_data])
    
    # Approx 0.4 kg CO2 per kWh
    carbon_footprint = total_energy_kwh * 0.4
    
    tips = [
        "Optimize machine active hours during off-peak energy pricing.",
        "Address phantom loads to save up to 12% energy.",
        "Consider replacing legacy drives causing high vibration and power loss.",
        "Turn off cooling units on Machine 1 during extended idle periods."
    ]
    
    return schemas.SustainabilityMetrics(
        carbon_footprint_kg=round(carbon_footprint, 4),
        energy_consumed_kwh=round(total_energy_kwh, 4),
        tips=tips
    )

@app.post("/api/voice-command")
async def handle_voice_command(request: schemas.VoiceCommandRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    action_data = await llm_service.parse_voice_command(request.command)

    action = action_data.get("action")
    machine_id = action_data.get("machine_id")

    # Gather live simulation context — sensor_data/anomaly_data are ORM objects
    live_data = crud.get_latest_data_per_machine(db)
    anomalous = [d for d in live_data if d["anomaly_data"] and d["anomaly_data"].is_anomaly]
    total_power = sum(
        [d["sensor_data"].power_consumption for d in live_data if d["sensor_data"]], 0
    )

    if action == "simulate_anomaly":
        spoken = f"Simulating anomaly on machine {machine_id}. Injecting fault pattern into sensor stream."
        return {"status": "success", "message": spoken, "spoken_text": spoken, "data": action_data}

    elif action == "get_energy_usage":
        if live_data:
            specific = next(
                (d for d in live_data if d["machine"]["id"] == machine_id), None
            )
            if specific and specific["sensor_data"]:
                sd = specific["sensor_data"]
                spoken = f"{specific['machine']['name']} is currently drawing {round(sd.power_consumption, 1)} watts and is {sd.state}."
            else:
                spoken = f"Total system power draw is {round(total_power, 1)} watts across {len(live_data)} machines."
        else:
            spoken = "No simulation data is available yet. Please start the simulation first."
        return {"status": "success", "message": spoken, "spoken_text": spoken, "data": action_data}

    elif action == "get_anomaly_status" or "anomaly" in request.command.lower() or "status" in request.command.lower():
        if not live_data:
            spoken = "No simulation data available. Start the simulation to begin monitoring."
        elif anomalous:
            names = ", ".join([a["machine"]["name"] for a in anomalous])
            types = ", ".join(set([a["anomaly_data"].anomaly_type for a in anomalous if a["anomaly_data"].anomaly_type]))
            spoken = f"Alert! {len(anomalous)} anomaly detected. Machines affected: {names}. Issue types: {types}. Immediate inspection recommended."
        else:
            spoken = f"All {len(live_data)} machines are operating normally. Total power draw is {round(total_power, 1)} watts. No anomalies detected."
        return {"status": "success", "message": spoken, "spoken_text": spoken, "data": action_data}

    elif action == "unknown":
        if live_data:
            spoken = f"I'm monitoring {len(live_data)} machines with a total load of {round(total_power, 1)} watts. {len(anomalous)} anomalies detected. How can I help you?"
        else:
            spoken = "I didn't understand that. Try asking about energy usage, anomaly status, or ask me to simulate an anomaly."
        return {"status": "info", "message": spoken, "spoken_text": spoken, "data": action_data}

    else:
        spoken = f"Action {action} executed successfully."
        return {"status": "success", "message": spoken, "spoken_text": spoken, "data": action_data}


@app.post("/api/transcribe")
async def transcribe_audio_endpoint(
    audio: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Accepts an audio file upload (webm/mp4/wav) and transcribes it
    using OpenAI Whisper. Returns the text transcript.
    """
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    transcript = await llm_service.transcribe_audio(audio_bytes, filename=audio.filename or "audio.webm")

    if not transcript:
        raise HTTPException(status_code=422, detail="Could not transcribe audio. Please speak more clearly.")

    return {"transcript": transcript}


class SpeakRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0


@app.post("/api/speak")
async def speak_text(
    request: SpeakRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Converts text to speech using Kokoro ONNX TTS.
    Returns a WAV audio stream the browser can play directly.
    """
    import asyncio
    import io

    loop = asyncio.get_event_loop()
    wav_bytes = await loop.run_in_executor(
        None,
        lambda: tts_service.synthesize(request.text, voice=request.voice, speed=request.speed)
    )

    if not wav_bytes:
        raise HTTPException(status_code=500, detail="TTS synthesis failed. Check Kokoro model files.")

    return StreamingResponse(
        io.BytesIO(wav_bytes),
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=response.wav"}
    )

