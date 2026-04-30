import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_single_match_stats():
    # Galatasaray vs Gaziantep or similar
    url = f"{BASE_URL}/football/fixtures/19442935" # Random fixture from previous check
    params = {
        "api_token": API_KEY,
        "include": "statistics.type"
    }
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    
    stats = data.get('statistics', [])
    for s in stats:
        type_obj = s.get('type', {})
        type_name = type_obj.get('name', 'Unknown')
        type_id = type_obj.get('id', 'Unknown')
        value = s.get('data', {}).get('value')
        print(f"ID: {type_id}, Name: {type_name}, Value: {value}")

if __name__ == "__main__":
    check_single_match_stats()
