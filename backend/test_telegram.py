import asyncio
import os
from dotenv import load_dotenv
import notifier

load_dotenv()

async def test_telegram_alert():
    print("Testing Telegram Notification System...")
    
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if not token or not chat_id:
        print("❌ Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in your .env file.")
        print("Please check the instructions provided to set them up.")
        return
        
    print(f"Using Chat ID: {chat_id}")
    
    # Send a mock anomaly
    success = await notifier.send_telegram_alert(
        machine_name="Test-Device-001",
        score=0.98,
        anomaly_type="Voltage Drop & High Current",
        alert_message="Critical voltage drop accompanied by abnormal current spike detected.",
        recommendation="Immediately inspect the electrical panel and check for loose connections."
    )
    
    if success:
        print("✅ Awesome! You should have received a Telegram message on your phone!")
    else:
        print("❌ Failed. Check your network, bot token, and chat ID.")

if __name__ == "__main__":
    asyncio.run(test_telegram_alert())
