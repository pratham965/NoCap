import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://router.huggingface.co/hf-inference/models/prithivMLmods/AI-vs-Deepfake-vs-Real"
headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}

def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers={"Content-Type": "image/jpeg", **headers}, data=data)
    return response.json()
