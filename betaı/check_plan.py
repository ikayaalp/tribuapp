import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_resources():
    url = f"{BASE_URL}/my/resources"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        print("Available Resources (truncated):")
        # Just print keys or first few items
        resources = data.get('data', [])
        for r in resources:
            if 'xg' in r.get('name', '').lower() or 'stat' in r.get('name', '').lower() or 'expected' in r.get('name', '').lower():
                print(f"Resource: {r.get('name')}")
    else:
        print(f"Failed to check resources. Status: {response.status_code}")

if __name__ == "__main__":
    check_resources()
