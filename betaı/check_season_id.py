import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_season(season_id):
    url = f"{BASE_URL}/football/seasons/{season_id}"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Season {season_id} Status: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    check_season(25682)
