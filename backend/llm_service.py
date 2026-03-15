import os
import json
import io
import httpx
from openai import AsyncAzureOpenAI, AsyncOpenAI
from dotenv import load_dotenv
import warnings

warnings.filterwarnings("ignore")
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY", "")
base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
whisper_model = os.getenv("WHISPER_MODEL_NAME", "whisper-1")  # Azure deployment name or "whisper-1"

# Extract azure_endpoint for AzureOpenAI client
azure_endpoint = base_url.split("/openai")[0] + "/" if "openai.azure.com" in base_url else base_url

# Creating a custom httpx client to bypass SSL certificate issues
http_client = httpx.AsyncClient(verify=False)

# Main chat completions client (Azure or standard OpenAI)
client = AsyncAzureOpenAI(
    api_key=api_key,
    api_version="2024-02-15-preview",
    azure_endpoint=azure_endpoint,
    http_client=http_client,
    timeout=20.0
)

# Whisper client — detect if we're on Azure or standard OpenAI
if "openai.azure.com" in base_url:
    # Azure OpenAI Whisper (requires a whisper deployment in your Azure resource)
    whisper_client = AsyncAzureOpenAI(
        api_key=api_key,
        api_version="2024-02-15-preview",
        azure_endpoint=azure_endpoint,
        http_client=http_client,
        timeout=60.0
    )
else:
    # Standard OpenAI Whisper API
    whisper_client = AsyncOpenAI(
        api_key=api_key,
        http_client=http_client,
        timeout=60.0
    )


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribes audio using OpenAI Whisper (standard openai.com endpoint).
    Azure OpenAI doesn't require a separate Whisper deployment on the standard API.
    """
    if not api_key:
        return ""

    try:
        # Always use standard OpenAI client for Whisper  
        # (Azure whisper deployments are rare; standard API whisper-1 is always available)
        from openai import AsyncOpenAI
        oai_client = AsyncOpenAI(
            api_key=api_key,
            http_client=http_client,
            timeout=60.0
        )
        audio_file = (filename, io.BytesIO(audio_bytes), "audio/webm")
        transcript = await oai_client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
            response_format="text"
        )
        return str(transcript).strip()
    except Exception as e:
        print(f"[Whisper] Standard OpenAI transcription failed: {e}")
        return ""


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

async def parse_voice_command(user_command: str):
    """
    Parses a natural language voice command into a JSON action.
    """
    if not api_key:
        return {"action": "error", "message": "API key not configured."}
        
    system_prompt = """You are a Command Parser for a Smart Energy Platform.
The user will provide a spoken command. Your goal is to return a JSON object representing the action to take.
Supported actions format:
{"action": "simulate_anomaly", "machine_id": <int>}
{"action": "get_energy_usage", "machine_id": <int>}
{"action": "detect_energy_leak"}
{"action": "get_top_energy_device"}
{"action": "get_machine_health", "machine_id": <int>}
{"action": "predict_maintenance", "machine_id": <int>}
{"action": "get_carbon_footprint"}
{"action": "generate_energy_tips"}
{"action": "simulate_power_spike", "machine_id": <int>}
{"action": "shutdown_device", "machine_id": <int>}
{"action": "optimize_energy"}
{"action": "get_anomaly_status"}
{"action": "unknown", "message": "Could not understand command"}

Respond ONLY with valid JSON."""

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_command}
            ],
            response_format={ "type": "json_object" },
            max_completion_tokens=150
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        print(f"LLM parsing failed: {e}")
        return {"action": "error", "message": str(e)}
