import os
import json
import httpx
from openai import AsyncAzureOpenAI
from dotenv import load_dotenv
import warnings

warnings.filterwarnings("ignore")
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY", "")
base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")

# Extract azure_endpoint for AzureOpenAI client
azure_endpoint = base_url.split("/openai")[0] + "/" if "openai.azure.com" in base_url else base_url

# Creating a custom httpx client to bypass SSL certificate issues
http_client = httpx.AsyncClient(verify=False)

client = AsyncAzureOpenAI(
    api_key=api_key,
    api_version="2024-02-15-preview",
    azure_endpoint=azure_endpoint,
    http_client=http_client,
    timeout=20.0
)

async def generate_anomaly_insight(machine_name: str, state: str, power: float, idle_duration: float, default_type: str):
    """
    Calls the LLM to generate a dynamic alert message and recommendation based on sensor data.
    """
    if not api_key:
        return None, None
        
    system_prompt = """You are an AI assistant monitoring an electrical grid for an industrial IoT system.
You will be provided with sensor reading context indicating an anomaly.
Your job is to generate a short, punchy `alert_message` (1-2 sentences) and a practical `recommendation` (1 sentence).
Respond ONLY in valid JSON format with keys "alert_message" and "recommendation".
"""

    user_prompt = f"""
Machine: {machine_name}
Current State: {state}
Power Consumption: {power} W
Idle Duration: {idle_duration} seconds
Detected Anomaly Type: {default_type}

Please provide the alert message and recommendation in JSON format.
"""

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" },
            max_completion_tokens=150
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("alert_message"), result.get("recommendation")
        
    except Exception as e:
        print(f"LLM generation failed: {e}")
        return None, None
