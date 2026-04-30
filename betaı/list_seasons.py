import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def list_seasons():
    url = f"{BASE_URL}/football/seasons"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total Seasons: {len(data.get('data', []))}")
        for s in data.get('data', [])[:20]:
            print(f"- {s['id']}: {s['name']} (League: {s['league_id']})")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    list_seasons()
