import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def check_stats_content():
    fixture_id = 19425142 
    stat_url = f"{BASE_URL}/football/fixtures/{fixture_id}?include=statistics.type"
    params = {"api_token": API_KEY}
    response = requests.get(stat_url, params=params)
    if response.status_code == 200:
        stats = response.json()['data'].get('statistics', [])
        print(f"Total stats: {len(stats)}")
        for s in stats:
            p_id = s.get('participant_id')
            type_info = s.get('type', {})
            type_name = type_info.get('name')
            type_id = s.get('type_id')
            val = s.get('data', {}).get('value')
            print(f"P={p_id} ID={type_id} Name={type_name} Value={val}")
    else:
        print(f"Error: {response.status_code}")

if __name__ == "__main__":
    check_stats_content()
