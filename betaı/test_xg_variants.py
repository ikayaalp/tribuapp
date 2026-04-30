import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
FIXTURE_ID = 19442935

def test_all_xg_variants():
    # Try different xG related includes
    includes = [
        "xGFixture",
        "lineups.xGLineup",
        "probabilities",
        "predictions",
        "statistics.type"
    ]
    
    for inc in includes:
        print(f"\nTesting include: {inc}...")
        url = f"{BASE_URL}/football/fixtures/{FIXTURE_ID}"
        params = {"api_token": API_KEY, "include": inc}
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json().get('data', {})
            # Print keys to see what we got
            print(f"Keys found: {list(data.keys())}")
            if inc == "probabilities":
                print(f"Probabilities available: {len(data.get('probabilities', []))}")
            if inc == "predictions":
                print(f"Predictions check: {data.get('predictions')}")
        else:
            print(f"Error: {response.json().get('message')}")

if __name__ == "__main__":
    test_all_xg_variants()
