import os
import httpx
from openai import OpenAI
from dotenv import load_dotenv
import warnings

# Suppress SSL warnings
warnings.filterwarnings("ignore")

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
model_name = os.getenv("OPENAI_MODEL_NAME")

print(f"Base URL: {base_url}")
print(f"Model: {model_name}")

# Use a synchronous httpx client with SSL verification disabled
http_client = httpx.Client(verify=False)

client = OpenAI(
    api_key=api_key,
    base_url=base_url,
    http_client=http_client,
    timeout=20.0
)

try:
    print("Sending request...")
    completion = client.chat.completions.create(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": "Reply with just one word: Paris",
            }
        ]
    )
    print("\nSuccess!")
    print(completion.choices[0].message.content)
except Exception as e:
    print(f"\nError: {type(e).__name__}: {e}")
