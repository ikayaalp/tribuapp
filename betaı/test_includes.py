import requests

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
LEAGUE_ID = 600

def test_includes():
    includes = [
        "currentSeason",
        "currentSeason.fixtures",
        "currentSeason.fixtures.scores",
        "currentSeason.fixtures.participants",
        "currentSeason.fixtures.round",
        "currentSeason.fixtures.statistics"
    ]
    
    for inc in includes:
        url = f"{BASE_URL}/football/leagues/{LEAGUE_ID}"
        params = {"api_token": API_KEY, "include": inc}
        resp = requests.get(url, params=params)
        print(f"Include '{inc}': Status {resp.status_code}")
        if resp.status_code != 200:
            try:
                print(f"  Error: {resp.json().get('message')}")
            except:
                print("  Error: Could not parse JSON")

if __name__ == "__main__":
    test_includes()
