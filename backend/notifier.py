import os
import httpx
from dotenv import load_dotenv

load_dotenv()

async def send_telegram_alert(machine_name: str, score: float, anomaly_type: str, alert_message: str, recommendation: str):
    """
    Sends an anomaly alert message via Telegram Bot.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        print("❌ Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    # Format the message beautifully with Markdown
    text_message = f"""
🚨 *Smart Energy Anomaly Detected!* 🚨

*Machine:* `{machine_name}`
*Anomaly Type:* {anomaly_type}
*Severity Score:* {score:.2f}

⚠️ *Alert:* {alert_message}

💡 *Recommendation:* {recommendation}
"""

    payload = {
        "chat_id": chat_id,
        "text": text_message,
        "parse_mode": "Markdown"
    }

    try:
        # Using the same custom HTTP client structure to bypass local SSL issues just in case
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code == 200:
                print(f"✅ Telegram alert sent successfully for {machine_name}")
                return True
            else:
                print(f"❌ Failed to send Telegram alert: {response.text}")
                return False
    except Exception as e:
        print(f"❌ Error sending Telegram alert: {e}")
        return False
