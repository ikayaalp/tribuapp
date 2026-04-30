import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
SEASON_ID = 25682

def find_galatasaray():
    url = f"{BASE_URL}/football/fixtures"
    params = {
        "api_token": API_KEY,
        "filters": f"fixtureSeasons:{SEASON_ID}",
        "include": "participants;scores;round"
    }
    response = requests.get(url, params=params)
    fixtures = response.json().get('data', [])
    for f in fixtures:
        participants = [p['name'] for p in f.get('participants', [])]
        if 'Galatasaray' in participants and f.get('round', {}).get('name') == '1':
            print(f"Found Galatasaray in week 1: ID {f['id']}")
            print(json.dumps(f['scores'], indent=2))
            break

if __name__ == "__main__":
    find_galatasaray()
