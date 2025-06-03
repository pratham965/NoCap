import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# System Prompt with Corrected JSON Format
SYSTEM_PROMPT = (
    
)

# API Configuration
API_URL = "https://api-inference.huggingface.co/v1/chat/completions"
HEADERS = {"Authorization": f"Bearer {os.getenv('API_KEY')}"}

def validate_statement(statement):
    """
    Sends the statement to the Hugging Face inference API for validation.
    
    Returns:
        dict: Parsed JSON response containing result, confidence, source, and explanation.
    """
    payload = {
        "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": statement},
        ],
        "max_tokens": 1024
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload)
        response.raise_for_status()  # Raises an error for HTTP failures

        # Parse the response
        response_data = response.json()
        model_response = response_data["choices"][0]["message"]["content"]

        # Ensure model response is valid JSON
        try:
            print(model_response)
            return model_response  # Returns a dictionary
        except json.JSONDecodeError:
            print("Error: Model returned invalid JSON.")
            return {"error": "Invalid JSON response from model"}

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return {"error": "API request failed"}

