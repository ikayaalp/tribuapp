import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ft#g4pKw5IMKLmV4tu2I8Oii" # Wait, the key has characters.

# Let's use the exact key from superlig_data.py
API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"

BASE_URL = "https://api.sportmonks.com/v3"

def list_my_leagues():
    url = f"{BASE_URL}/football/leagues"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        leagues = data.get('data', [])
        print(f"Total Leagues: {len(leagues)}")
        for l in leagues[:10]:
            print(f"- {l['id']}: {l['name']}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    list_my_leagues()
