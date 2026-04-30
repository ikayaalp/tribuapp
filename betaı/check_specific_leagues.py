import requests

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def search_leagues():
    url = f"{BASE_URL}/football/leagues"
    params = {"api_token": API_KEY, "filters": "leagues:8,564,600"}
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    print(f"Data: {response.text}")

if __name__ == "__main__":
    search_leagues()
