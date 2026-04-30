import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
SEASON_ID = 25682

def debug_scores():
    url = f"{BASE_URL}/football/fixtures"
    params = {
        "api_token": API_KEY,
        "filters": f"fixtureSeasons:{SEASON_ID}",
        "include": "scores"
    }
    response = requests.get(url, params=params)
    data = response.json().get('data', [])
    if data:
        # Print the first fixture's scores in detail
        fixture = data[0]
        print(f"Fixture ID: {fixture['id']}")
        print(f"Scores: {json.dumps(fixture['scores'], indent=2)}")
    else:
        print("No fixtures found.")

if __name__ == "__main__":
    debug_scores()
