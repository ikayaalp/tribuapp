import requests
import json

API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
BASE_URL = "https://api.sportmonks.com/v3"

def find_any_xg_type():
    page = 1
    has_more = True
    print("Searching for ALL types related to goals or expected...")
    while has_more:
        url = f"{BASE_URL}/football/types"
        params = {"api_token": API_KEY, "page": page}
        response = requests.get(url, params=params)
        data = response.json()
        
        types = data.get('data', [])
        for t in types:
            name = t['name'].lower()
            if 'exp' in name or 'xg' in name or 'goal' in name:
                print(f"ID: {t['id']}, Name: {t['name']}, Group: {t.get('group')}")
        
        pagination = data.get('pagination', {})
        has_more = pagination.get('has_more', False)
        page += 1
        if page > 50: # Safety break
            break

if __name__ == "__main__":
    find_any_xg_type()
