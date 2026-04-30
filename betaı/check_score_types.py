import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_score_types():
    url = f"{BASE_URL}/football/types"
    params = {
        "api_token": API_KEY# No filter for groups, let's just search all
    }
    response = requests.get(url, params=params)
    types = response.json().get('data', [])
    for t in types:
        if 'score' in t['name'].lower() or 'final' in t['name'].lower() or 'fulltime' in t['name'].lower():
            print(f"ID: {t['id']}, Name: {t['name']}, Group: {t.get('group')}")

if __name__ == "__main__":
    check_score_types()
