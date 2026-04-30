import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"
FIXTURE_ID = 19442935 # Gaziantep - Galatasaray

def check_all_stats():
    # Fetch all statistics for a known match
    url = f"{BASE_URL}/football/fixtures/{FIXTURE_ID}?include=statistics"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    data = response.json().get('data', {})
    stats = data.get('statistics', [])
    
    print(f"Total stats found: {len(stats)}")
    for s in stats:
        # Check for any float value or any type_id that might be xG
        name = "Unknown" # Ideally I'd fetch type names, but let's just look at values first
        value = s.get('data', {}).get('value')
        type_id = s.get('type_id')
        print(f"TypeID: {type_id}, Value: {value}")
        
if __name__ == "__main__":
    check_all_stats()
