import requests
import json

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://www.fotmob.com/",
})

# İlk maçın ID'si (Gaziantep FK vs Galatasaray)
match_id = "4842318"

url = f"https://www.fotmob.com/api/matchDetails?matchId={match_id}"
resp = session.get(url, timeout=15)
print(f"Status: {resp.status_code}")

data = resp.json()

# Üst seviye anahtarlar
print("\n=== ÜST SEVİYE ===")
for k, v in data.items():
    if isinstance(v, dict):
        print(f"  {k}: dict -> {list(v.keys())[:6]}")
    elif isinstance(v, list):
        print(f"  {k}: list[{len(v)}]")
    else:
        print(f"  {k}: {type(v).__name__} = {str(v)[:60]}")

# content anahtarını detaylı incele
if "content" in data:
    print("\n=== content ===")
    for k, v in data["content"].items():
        if isinstance(v, dict):
            print(f"  {k}: dict -> {list(v.keys())[:6]}")
        elif isinstance(v, list):
            print(f"  {k}: list[{len(v)}]")
        else:
            print(f"  {k}: {type(v).__name__}")

# stats varsa detay
if "content" in data and "stats" in data["content"]:
    print("\n=== content.stats ===")
    stats = data["content"]["stats"]
    print(json.dumps(stats, ensure_ascii=False, indent=2)[:2000])

with open("match_detail_raw.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("\n💾 match_detail_raw.json kaydedildi.")