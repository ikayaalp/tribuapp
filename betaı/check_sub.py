import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_subscription():
    url = f"{BASE_URL}/my/subscription"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    print(f"Raw: {response.text[:500]}")

if __name__ == "__main__":
    check_subscription()
