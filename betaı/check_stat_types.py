import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_stat_types():
    url = f"{BASE_URL}/football/types"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    types = response.json().get('data', [])
    keywords = ['redcard', 'red card', 'red', 'penalt', 'shot', 'target']
    
    for t in types:
        name = t.get('name', '').lower()
        if any(k in name for k in keywords):
            print(f"ID: {t['id']}, Name: {t['name']}")

if __name__ == "__main__":
    check_stat_types()
