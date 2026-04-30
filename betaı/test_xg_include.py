import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
FIXTURE_ID = 19442935 # A recent Super Lig match

def test_xg_include():
    url = f"{BASE_URL}/football/fixtures/{FIXTURE_ID}"
    params = {
        "api_token": API_KEY,
        "include": "xGFixture"
    }
    print(f"Testing xGFixture include for Fixture {FIXTURE_ID}...")
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json().get('data', {})
        xg_data = data.get('xgfixture') # Check both cases
        if not xg_data:
            xg_data = data.get('xGFixture')
            
        if xg_data:
            print("SUCCESS! xG data found:")
            print(json.dumps(xg_data, indent=2))
        else:
            print("Included successfully but 'xgfixture' key not found in data.")
            print("Available keys in data:", list(data.keys()))
    else:
        print(f"Error Message: {response.json().get('message')}")

if __name__ == "__main__":
    test_xg_include()
