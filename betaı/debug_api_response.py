import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def debug_season_id(league_id):
    url = f"{BASE_URL}/football/leagues/{league_id}?include=currentSeason"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"League {league_id} Status: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
    except:
        print(f"Raw: {response.text}")

if __name__ == "__main__":
    debug_season_id(8)   # PL
    debug_season_id(564) # La Liga
