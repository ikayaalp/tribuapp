import requests
import json
import time

API_KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNy"
BASE_URL = "https://api.sportmonks.com/v3"

LEAGUE_IDS = {
    "Premier League": 8,
    "La Liga": 564,
    "Bundesliga": 82,
    "Serie A": 384,
    "Ligue 1": 301,
    "Eredivisie": 462,
    "Super Lig": 600,
    "Liga Portugal": 501,
}

results = {}

for name, lid in LEAGUE_IDS.items():
    try:
        url = f"{BASE_URL}/football/leagues/{lid}"
        params = {"api_token": API_KEY, "include": "currentSeason"}
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json().get("data", {})
        
        cs = data.get("currentseason")
        if cs:
            results[name] = {"league_id": lid, "season_id": cs["id"], "season_name": cs.get("name", "")}
        else:
            results[name] = {"league_id": lid, "season_id": "NOT_FOUND", "season_name": "N/A"}
    except Exception as e:
        results[name] = {"league_id": lid, "season_id": f"ERROR: {e}", "season_name": "N/A"}
    time.sleep(0.3)

# Save and print
with open("season_ids_result.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

for name, info in results.items():
    print(f"{name:20s} | League: {info['league_id']:5} | Season: {info['season_id']} | {info['season_name']}")
