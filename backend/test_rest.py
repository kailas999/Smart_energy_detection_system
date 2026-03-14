import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
model_name = os.getenv("OPENAI_MODEL_NAME")
# Use the correct Azure API path standard:
base_url = f"{os.getenv('OPENAI_BASE_URL').rstrip('/')}/deployments/{model_name}/chat/completions?api-version=2024-02-15-preview"

headers = {
    "Content-Type": "application/json",
    "api-key": api_key,
}

data = {
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "max_tokens": 50
}

try:
    print(f"Sending request to: {base_url}")
    response = requests.post(base_url, headers=headers, json=data, verify=False, timeout=10)
    print(f"Status: {response.status_code}")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
