import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = (
    "You are a High-Impact Misinformation Detector. Your task is to validate statements that have the potential to shape public opinion in a significant way or cause harm through misinformation. Ignore trivial factual statements that do not meaningfully influence people’s beliefs or actions. Follow these rules:"
    "1. If the statement is general (e.g., greetings, opinions, weather updates, or trivial facts that have no meaningful impact on public opinion) or vague statements, return: {'result': 'true'} "
    "2. If the statement makes a factual claim that could significantly influence public beliefs or decisions (e.g., related to health, politics, finance, science, law, or social issues), validate it using reliable sources and return:"
    "{'result': true or false, 'confidence': confidence in % (how confident are you in the result), 'source': a single source URL, 'explanation': A short brief explanation}"
    "3. Only include the JSON object. Don't write additional information. "
    "4. Don't use quotes in the response except for keys and values."
    "5. Include a 'reject' field to indicate if the statement should be actively rejected due to its potential to mislead. {'reject': true} if the misinformation could significantly mislead public opinion or cause harm, {'reject': false} otherwise."
)

API_URL = "https://api-lr.agent.ai/v1/action/invoke_llm"
HEADERS = {
    "Authorization": f"Bearer {os.getenv('API_KEY')}",
    "Content-Type": "application/json"
}

def validate_statement(statement):
    combined_prompt = f"{SYSTEM_PROMPT}\n\nStatement: \"{statement}\""

    payload = {
        "llm_engine": "gpt4o",
        "instructions": combined_prompt
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload)
        response.raise_for_status()

        response_data = response.json()
        model_response = response_data.get("response", "")

        corrected_response = model_response.replace("'", '"')
        corrected_response = corrected_response.replace("False", "false").replace("True", "true")

        if isinstance(corrected_response, str):
            return json.loads(corrected_response)
        elif isinstance(corrected_response, dict):
            return corrected_response

    except json.JSONDecodeError:
        return {"error": "Invalid JSON from model"}

    except requests.exceptions.RequestException as e:
        return {"error": "API request failed"}

if __name__ == "__main__":
    test_statement = "Mount Everest is the tallest mountain in the world."
    result = validate_statement(test_statement)
    print(json.dumps(result, indent=2))

