import requests
resp = requests.get('https://api.sportmonks.com/v3/football/leagues', params={'api_token': 'nUO9dEc5YXoXsZpPa1XoutAMaxo2GHSxzIg272q8jH8qtCsLMTRsyi8WajQa', 'search': 'Portugal'})
data = resp.json().get('data', [])
for s in data:
    print(f"{s['id']} -> {s['name']}")

resp = requests.get('https://api.sportmonks.com/v3/football/leagues', params={'api_token': 'nUO9dEc5YXoXsZpPa1XoutAMaxo2GHSxzIg272q8jH8qtCsLMTRsyi8WajQa', 'search': 'primeira'})
data = resp.json().get('data', [])
for s in data:
    print(f"{s['id']} -> {s['name']}")
