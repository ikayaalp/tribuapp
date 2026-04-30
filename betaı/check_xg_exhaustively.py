import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_xg_exhaustively():
    # 1. Get some fixtures from Super Lig (League 600)
    print("Fetching recent fixtures...")
    url = f"{BASE_URL}/football/fixtures"
    params = {
        "api_token": API_KEY,
        "filters": "fixtureLeagues:600",
        "include": "statistics.type;xGFixture;expectedLineups"
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Error fetching fixtures with includes: {response.status_code}")
        print(response.json().get('message'))
    
    data = response.json().get('data', [])
    if not data:
        print("No fixtures found.")
        return

    # Check first fixture for xGFixture access error/success
    print(f"\nChecking Fixture {data[0]['id']} for xG...")
    
    # Check if xGFixture is in the response despite potential 403 on the whole include? 
    # (Actually if one include fails, the whole request returns 403 in Sportmonks V3)
    
    # Let's try WITHOUT xGFixture to see what's in statistics
    params["include"] = "statistics.type"
    response = requests.get(url, params=params)
    data = response.json().get('data', [])
    
    for f in data[:3]: # Check first 3 fixtures
        print(f"\nFixture: {f['id']} - {f['name']}")
        stats = f.get('statistics', [])
        found_xg = False
        for s in stats:
            t = s.get('type', {})
            t_name = t.get('name', '').lower()
            if 'expected' in t_name or 'xg' in t_name:
                print(f"  FOUND xG STAT: Type {t['id']} ({t['name']}) = {s.get('data', {}).get('value')}")
                found_xg = True
        if not found_xg:
            print("  No xG found in statistics.")

if __name__ == "__main__":
    check_xg_exhaustively()
