import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def verify_xg_id():
    # Fixture IDs: 19442935 (Gala), 18841616 (EPL)
    fixture_ids = [19442935, 18841616]
    for fid in fixture_ids:
        url = f"{BASE_URL}/football/fixtures/{fid}?include=statistics"
        params = {"api_token": API_KEY}
        response = requests.get(url, params=params)
        stats = response.json().get('data', {}).get('statistics', [])
        
        print(f"\nFixture {fid}:")
        for s in stats:
            if s.get('type_id') == 5304:
                print(f"  Type 5304 Value: {s.get('data', {}).get('value')} (Location: {s.get('location')})")

if __name__ == "__main__":
    verify_xg_id()
