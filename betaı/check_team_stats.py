import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_team_stats():
    # 1. Checked Fixture 19442935 (Gala)
    url = f"{BASE_URL}/football/fixtures/19442935"
    params = {
        "api_token": API_KEY,
        "include": "participants.statistics.type"
    }
    print("Checking team-level statistics for Galatasaray match...")
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    participants = data.get('participants', [])
    
    for p in participants:
        print(f"\nTeam: {p['name']}")
        stats = p.get('statistics', [])
        found = False
        for s in stats:
            t_name = s.get('type', {}).get('name', '').lower()
            if 'expected' in t_name or 'xg' in t_name:
                print(f"  FOUND: {t_name} = {s.get('data', {}).get('value')}")
                found = True
        if not found:
            print("  No xG stats for this team.")

if __name__ == "__main__":
    check_team_stats()
