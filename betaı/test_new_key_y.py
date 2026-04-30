import requests

# The NEW key provided by the user (ends in 'y')
KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNy"

def test_api():
    url = "https://api.sportmonks.com/v3/my/resources"
    params = {"api_token": KEY}
    try:
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
