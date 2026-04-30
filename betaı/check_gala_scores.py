import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
FIXTURE_ID = 19442930 # Antalyaspor - Kasımpaşa

def check_scores():
    url = f"{BASE_URL}/football/fixtures/{FIXTURE_ID}?include=scores"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    scores = data.get('scores', [])
    for s in scores:
        print(f"Goals: {s.get('score', {}).get('goals')}, TypeID: {s.get('type_id')}, Desc: {s.get('description')}, ParticipantID: {s.get('participant_id')}")

if __name__ == "__main__":
    check_scores()
