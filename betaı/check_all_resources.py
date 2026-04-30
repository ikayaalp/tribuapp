import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_resources():
    url = f"{BASE_URL}/my/resources"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        resources = data.get('data', [])
        print(f"Total Resources: {len(resources)}")
        for r in resources:
            name = r.get('name')
            if name:
                print(f"- {name}")
            else:
                # Check for other keys like 'resource' or 'id'
                # print(f"Raw: {r}")
                pass
    else:
        print(f"Error: {response.status_code}")

if __name__ == "__main__":
    check_resources()
