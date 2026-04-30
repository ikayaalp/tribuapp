import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def debug_expected_endpoint():
    url = f"{BASE_URL}/football/expected/fixtures"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        print("Success! /football/expected/fixtures is accessible.")
        data = response.json().get('data', [])
        print(f"Number of expected fixture data: {len(data)}")
        if len(data) > 0:
            print(f"Sample: {data[0]}")
    else:
        print(f"Failed. Status: {response.status_code}")
        print(f"Error: {response.json().get('message', 'No message')}")

if __name__ == "__main__":
    debug_expected_endpoint()
