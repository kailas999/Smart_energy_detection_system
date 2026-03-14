# AI-Based Energy Leak & Hidden Power Loss Detection System

An end-to-end full stack project built to detect hidden energy leaks in industrial machines using IoT sensor data and Artificial Intelligence (Isolation Forest).

## Features
- **Fake IoT Sensor Data Generator**: Continuously simulates realtime data (timestamp, voltage, current, power, temperature, vibration) every 5 seconds for registered machines and injects realistic anomalies representing energy leaks.
- **Machine Learning**: An `IsolationForest` model to identify abnormal power jumps. Model is re-trainable dynamically via API endpoints.
- **Backend API**: Built with **FastAPI** to orchestrate simulated endpoints, manage machine/sensor logs, and store records.
- **Database**: **PostgreSQL** handles historical and telemetry storage using `SQLAlchemy`.
- **Frontend Dashboard**: Beautiful **React + TailwindCSS + Recharts** realtime dashboard updating every 5 seconds, displaying machine statuses, real-time plotted energy consumption, carbon footprint, and a direct alert panel for anomaly catches.

## Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Scikit-Learn
- **Frontend**: React (Vite), TailwindCSS, Recharts, Axios, Lucide-React

## How to Run

### 1. Database Setup
1. Ensure you have **PostgreSQL** running locally.
2. Create a database named `energy_db`.
   ```bash
   psql -U postgres -c "CREATE DATABASE energy_db;"
   ```
*(By default, the connection uses `postgresql://postgres:postgres@localhost/energy_db`. Update `backend/database.py` if your credentials differ.)*

### 2. Backend Setup
1. Open a terminal and navigate to the project directory:
   ```bash
   cd d:\Smart\energy_leak_detector
   ```
2. Create and activate a Virtual Environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r backend\requirements.txt
   ```
4. Start the backend Server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### 3. Frontend Setup
1. Open a **new terminal**, navigate to the frontend directory:
   ```bash
   cd d:\Smart\energy_leak_detector\frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
4. Click **Start Simulation** on the dashboard to trigger the background data generation and start visualizing the machine data.

---
**Enjoy live anomaly detection!**
