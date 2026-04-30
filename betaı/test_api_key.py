import requests

API_KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNu"
BASE_URL = "https://api.sportmonks.com/v3"

def test_api():
    url = f"{BASE_URL}/my/resources"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_api()
