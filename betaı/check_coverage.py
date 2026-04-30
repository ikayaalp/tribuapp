import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
LEAGUE_ID = 600

def check_coverage():
    url = f"{BASE_URL}/football/leagues/{LEAGUE_ID}"
    params = {"api_token": API_KEY, "include": "coverage"}
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    coverage = data.get('coverage', [])
    
    print(f"Coverage for League {LEAGUE_ID}:")
    for c in coverage:
        print(f"ID: {c['type_id']}, Name: {c.get('name', 'N/A')}, Sub: {c.get('is_sub_coverage', False)}")

if __name__ == "__main__":
    check_coverage()
