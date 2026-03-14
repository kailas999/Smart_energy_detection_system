import os
import httpx
from openai import AzureOpenAI
from dotenv import load_dotenv
import warnings

# Suppress SSL warnings
warnings.filterwarnings("ignore")

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL", "")
model_name = os.getenv("OPENAI_MODEL_NAME")

# Extract azure_endpoint (usually the host part without /openai/v1)
if "openai.azure.com" in base_url:
    azure_endpoint = base_url.split("/openai")[0] + "/"
else:
    azure_endpoint = base_url

print(f"Azure Endpoint: {azure_endpoint}")
print(f"Model/Deployment: {model_name}")

http_client = httpx.Client(verify=False)

client = AzureOpenAI(
    api_key=api_key,
    api_version="2024-02-15-preview",
    azure_endpoint=azure_endpoint,
    http_client=http_client,
    timeout=20.0
)

try:
    print("Sending request via AzureOpenAI client...")
    completion = client.chat.completions.create(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": "Reply with just one word: Paris",
            }
        ],
        max_completion_tokens=10
    )
    print("\nSuccess!")
    print(completion.choices[0].message.content)
except Exception as e:
    print(f"\nError [{type(e).__name__}]: {e}")
