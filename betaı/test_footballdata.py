import requests

KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNu"

def check_footballdata():
    url = "https://api.football-data.org/v4/competitions"
    headers = {"X-Auth-Token": KEY}
    try:
        response = requests.get(url, headers=headers)
        print(f"Football-Data Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_footballdata()
