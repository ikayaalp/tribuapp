import requests

KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNu"

def check_apifootball():
    url = "https://v3.football.api-sports.io/status"
    headers = {"x-apisports-key": KEY}
    try:
        response = requests.get(url, headers=headers)
        print(f"API-Sports Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_apifootball()
