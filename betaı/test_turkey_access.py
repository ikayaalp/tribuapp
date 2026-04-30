import requests

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_turkey():
    url = f"{BASE_URL}/football/leagues/600"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Turkey Status: {response.status_code}")
    if response.status_code == 200:
        print("Turkey access: YES")
        print(response.json())
    else:
        print(f"Turkey access: NO ({response.text})")

if __name__ == "__main__":
    check_turkey()
