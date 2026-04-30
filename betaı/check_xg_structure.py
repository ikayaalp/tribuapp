import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
FIXTURE_ID = 19442935

def check_xg_structure():
    url = f"{BASE_URL}/football/fixtures/{FIXTURE_ID}"
    params = {
        "api_token": API_KEY,
        "include": "xGFixture"
    }
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    xgfixture = data.get('xgfixture')
    if xgfixture:
        print("xGFixture object:")
        print(json.dumps(xgfixture, indent=2))
    else:
        print("xgfixture key not found at root.")
        print("Keys:", list(data.keys()))

if __name__ == "__main__":
    check_xg_structure()
