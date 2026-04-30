import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_player():
    player_id = 133127 # N. Zaniolo
    url = f"{BASE_URL}/football/players/{player_id}"
    params = {
        "api_token": API_KEY,
        "include": "transfers;metadata"
    }
    response = requests.get(url, params=params)
    data = response.json()
    player_data = data.get('data', {})
    
    with open("player_test.json", "w", encoding="utf-8") as f:
        json.dump(player_data, f, indent=4, ensure_ascii=False)
    print("Saved player data.")

if __name__ == '__main__':
    check_player()
