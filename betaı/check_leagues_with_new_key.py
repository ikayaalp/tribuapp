import requests
import json

API_KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNy"
BASE_URL = "https://api.sportmonks.com/v3"

def check_leagues():
    for lid in [8, 564]:
        url = f"{BASE_URL}/football/leagues/{lid}"
        params = {"api_token": API_KEY}
        response = requests.get(url, params=params)
        print(f"League {lid} Status: {response.status_code}")
        if response.status_code == 200:
            print(f"League {lid} Access: YES")
        else:
            print(f"League {lid} Access: NO ({response.text})")

if __name__ == "__main__":
    check_leagues()
