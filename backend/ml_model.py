import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

MODEL_PATH = "isolation_forest_model.pkl"

class EnergyAnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False
        self.load_model()

    def train(self, df: pd.DataFrame):
        """
        Train the Isolation Forest model on historical sensor data.
        df should have columns: ['power_consumption', 'idle_duration']
        """
        features = df[['power_consumption', 'idle_duration']]
        if len(features) < 10:
            return False, "Not enough data to train"
        
        self.model.fit(features)
        self.is_trained = True
        
        # Save model
        joblib.dump(self.model, MODEL_PATH)
        return True, "Model trained successfully"

    def predict(self, data_point: dict):
        """
        Predict if a single data point is an anomaly.
        data_point: dict with keys matching features, plus 'state' for classification.
        Returns: (is_anomaly (bool), anomaly_score (float), anomaly_type (str), alert_message (str), recommendation (str))
        """
        if not self.is_trained:
            return False, 0.0, None, None, None
            
        df = pd.DataFrame([data_point])
        features = df[['power_consumption', 'idle_duration']]
        
        # predict returns 1 for inliers, -1 for outliers
        prediction = self.model.predict(features)[0]
        # score_samples returns opposite of anomaly score (lower is more anomalous)
        # We invert it for easier understanding (higher = more anomalous)
        score = -self.model.score_samples(features)[0]
        
        is_anomaly = True if prediction == -1 else False

        anomaly_type = None
        alert_message = None
        recommendation = None

        if is_anomaly:
            state = data_point.get('state', 'Unknown')
            power = data_point.get('power_consumption', 0)
            idle_duration = data_point.get('idle_duration', 0)

            if state == 'Idle' and power > 10 and idle_duration > 60:
                anomaly_type = "Hidden Leak"
                alert_message = f"⚠️ Energy Leak Detected: High idle power consumption. Power consumption is {int(power)}W, well above normal idle levels."
                recommendation = "Background processes detected. Suggested Action: Close unnecessary programs"
            elif state == 'Idle' and power > 0 and idle_duration > 300: # 5 mins idle
                anomaly_type = "Phantom Load"
                alert_message = f"⚠️ Energy Leak Detected: Phantom Load. Device is drawing {int(power)}W while seemingly disconnected."
                recommendation = "Charger detected without device. Suggested Action: Unplug to save energy"
            elif state == 'Active' and power > 150: # Arbitrary high threshold for spike
                anomaly_type = "Inefficiency Spike"
                alert_message = f"⚠️ Energy Leak Detected: Inefficiency Spike. Unusual peak of {int(power)}W during active use."
                recommendation = "High energy draw. Suggested Action: Check for heavy background processes or pending software updates."
            else:
                anomaly_type = "General Anomaly"
                alert_message = "⚠️ Energy Leak Detected: Unusual power consumption patterns."
                recommendation = "Suggested Action: Monitor system usage to identify the cause."

        return is_anomaly, float(score), anomaly_type, alert_message, recommendation

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.is_trained = True

anomaly_detector = EnergyAnomalyDetector()
