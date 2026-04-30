import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_turkey_v3():
    # League 600 (Süper Lig)
    url = f"{BASE_URL}/football/leagues/600?include=currentSeason"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    check_turkey_v3()
