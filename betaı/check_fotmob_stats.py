import requests
import json

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://www.fotmob.com/",
})

def fetch_fotmob_stats():
    # first fetch league to get a valid match id
    LEAGUE_ID = 71
    url = f"https://www.fotmob.com/api/leagues?id={LEAGUE_ID}"
    resp = session.get(url, timeout=15)
    matches = resp.json()["fixtures"]["allMatches"]
    finished = [m for m in matches if m.get("status", {}).get("finished") is True]
    if not finished:
        print("No finished matches.")
        return
    match_id = finished[0]["id"]
    print(f"Using match ID: {match_id} ({finished[0]['home']['name']} vs {finished[0]['away']['name']})")
    
    url = f"https://www.fotmob.com/api/matchDetails?matchId={match_id}"
    resp = session.get(url)
    data = resp.json()
    
    # Dump stats
    stats_groups = (
        data.get("content", {})
            .get("stats", {})
            .get("Periods", {})
            .get("All", {})
            .get("stats", [])
    )
    for group in stats_groups:
        print(f"Group: {group.get('title')}")
        for stat in group.get("stats", []):
            print(f"  {stat.get('title')}: {stat.get('stats')}")

if __name__ == "__main__":
    fetch_fotmob_stats()
