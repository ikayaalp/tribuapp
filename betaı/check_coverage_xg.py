import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
SEASON_ID = 25682

def check_season_xg_coverage():
    url = f"{BASE_URL}/football/fixtures?filters=fixtureSeasons:{SEASON_ID}&include=statistics;xGFixture"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    fixtures = response.json().get('data', [])
    
    total = len(fixtures)
    with_xg = 0
    with_big_chances = 0
    
    for f in fixtures:
        stats = f.get('statistics', [])
        has_xg = any(s.get('type_id') == 5304 for s in stats)
        has_bc = any(s.get('type_id') == 581 for s in stats)
        if has_xg: with_xg += 1
        if has_bc: with_big_chances += 1
            
    print(f"Total Fixtures in sample: {total}")
    print(f"Fixtures with xG (5304): {with_xg}")
    print(f"Fixtures with Big Chances (581): {with_big_chances}")

if __name__ == "__main__":
    check_season_xg_coverage()
