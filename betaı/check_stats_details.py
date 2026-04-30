import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
FIXTURE_ID = 19442935

def check_details():
    url = f"{BASE_URL}/football/fixtures/{FIXTURE_ID}"
    params = {
        "api_token": API_KEY,
        "include": "statistics.details.type"
    }
    print("Checking statistics.details.type for xG...")
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    stats = data.get('statistics', [])
    for s in stats:
        details = s.get('details', [])
        for d in details:
            t_name = d.get('type', {}).get('name', '').lower()
            if 'expected' in t_name or 'xg' in t_name:
                print(f"  FOUND: {t_name} = {d.get('value')}")

if __name__ == "__main__":
    check_details()
