"""
Kokoro TTS Service using kokoro-onnx (Python 3.13 compatible).
Model files are auto-downloaded from HuggingFace on first use.
"""

import io
import os
import urllib.request

MODEL_PATH = "kokoro-v0_19.onnx"
VOICES_PATH = "voices-v1.0.bin"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices-v1.0.bin"

_kokoro = None


def _download_if_missing():
    """Download Kokoro model files if not already present."""
    for path, url in [(MODEL_PATH, MODEL_URL), (VOICES_PATH, VOICES_URL)]:
        if not os.path.exists(path):
            print(f"[TTS] Downloading {path} from {url} ...")
            try:
                urllib.request.urlretrieve(url, path)
                print(f"[TTS] Downloaded {path} ({os.path.getsize(path) // 1024 // 1024} MB)")
            except Exception as e:
                print(f"[TTS] Download failed for {path}: {e}")
                return False
    return True


def _get_kokoro():
    global _kokoro
    if _kokoro is None:
        if not _download_if_missing():
            return None
        try:
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
            print("[TTS] Kokoro ONNX model loaded successfully.")
        except Exception as e:
            print(f"[TTS] Failed to load Kokoro: {e}")
            _kokoro = None
    return _kokoro


def synthesize(text: str, voice: str = "af_heart", speed: float = 1.0) -> bytes | None:
    """
    Synthesize text to speech using Kokoro ONNX.
    Returns raw WAV bytes, or None if TTS fails.
    """
    import soundfile as sf

    kokoro = _get_kokoro()
    if kokoro is None:
        return None

    try:
        samples, sample_rate = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        buf = io.BytesIO()
        sf.write(buf, samples, sample_rate, format="WAV", subtype="PCM_16")
        buf.seek(0)
        return buf.read()
    except Exception as e:
        print(f"[TTS] Kokoro synthesis error: {e}")
        return None
