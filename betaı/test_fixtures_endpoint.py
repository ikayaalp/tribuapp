import requests

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
SEASON_ID = 25682

def test_fixtures_endpoint():
    # Use filters for season ID
    url = f"{BASE_URL}/football/fixtures"
    params = {
        "api_token": API_KEY,
        "filters": f"fixtureSeasons:{SEASON_ID}",
        "include": "scores;participants;round;statistics"
    }
    print(f"Testing fixtures endpoint with filters: fixtureSeasons:{SEASON_ID}")
    resp = requests.get(url, params=params)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json().get('data', [])
        print(f"Number of fixtures found: {len(data)}")
        if len(data) > 0:
            print(f"First fixture keys: {list(data[0].keys())}")
    else:
        print(f"Error: {resp.json().get('message')}")

if __name__ == "__main__":
    test_fixtures_endpoint()
