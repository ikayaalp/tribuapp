import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_epl_xg():
    # 1. Check EPL (League 8) fixtures for xG
    print("Checking EPL (League 8) for xG statistics...")
    url = f"{BASE_URL}/football/fixtures"
    params = {
        "api_token": API_KEY,
        "filters": "fixtureLeagues:8",
        "include": "statistics.type"
    }
    response = requests.get(url, params=params)
    data = response.json().get('data', [])
    if not data:
        print("No EPL fixtures found.")
        return

    for f in data[:2]:
        print(f"\nEPL Fixture: {f['id']} - {f['name']}")
        found = False
        for s in f.get('statistics', []):
            t_name = s.get('type', {}).get('name', '').lower()
            if 'expected' in t_name or 'xg' in t_name:
                print(f"  FOUND: {t_name} = {s.get('data', {}).get('value')}")
                found = True
        if not found:
            print("  No xG stats in EPL summary.")

if __name__ == "__main__":
    check_epl_xg()
