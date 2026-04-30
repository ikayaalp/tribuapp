import requests

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def test_original_key():
    # Test with Premier League (ID: 8)
    url = f"{BASE_URL}/football/leagues/8"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"PL Status: {response.status_code}")
    if response.status_code == 200:
        print("PL access: YES")
    else:
        print(f"PL access: NO ({response.text})")

    # Test with La Liga (ID: 564)
    url = f"{BASE_URL}/football/leagues/564"
    response = requests.get(url, params=params)
    print(f"La Liga Status: {response.status_code}")
    if response.status_code == 200:
        print("La Liga access: YES")
    else:
        print(f"La Liga access: NO ({response.text})")

if __name__ == "__main__":
    test_original_key()
