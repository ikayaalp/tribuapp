import requests
from bs4 import BeautifulSoup
import json
import time

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
}

TEAM_URLS = [
    ("Aston Villa", "https://www.transfermarkt.com.tr/aston-villa/kader/verein/405/saison_id/2025"),
    ("Leeds United", "https://www.transfermarkt.com.tr/leeds-united/kader/verein/399/saison_id/2025")
]

players_data = []

for team_name, url in TEAM_URLS:
    print(f"Scraping {team_name}...")
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"Failed {team_name}")
            continue
            
        soup = BeautifulSoup(r.text, 'html.parser')
        table = soup.select_one("table.items > tbody")
        if not table:
            # Fallback to 2024 if 2025 doesn't exist
            url2 = url.replace("2025", "2024")
            r2 = requests.get(url2, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(r2.text, 'html.parser')
            table = soup.select_one("table.items > tbody")
            
        if not table:
            continue
            
        rows = table.find_all("tr", recursive=False)
        for row in rows:
            if not row.get("class") or ("odd" not in row.get("class") and "even" not in row.get("class")):
                continue
                
            tds = row.find_all("td", recursive=False)
            if len(tds) < 5: continue
            
            # Position
            pos_tag = row.select_one("table.inline-table tr:nth-child(2) td")
            pos = pos_tag.text.strip() if pos_tag else "Bilinmiyor"
            
            # Name
            name_tag = row.select_one("td.hauptlink a")
            name = name_tag.text.strip() if name_tag else "İsimsiz"
            
            # Date of Birth / Age
            dob_tag = tds[2]
            age = ""
            if dob_tag:
                import re
                match = re.search(r'\((\d+)\)', dob_tag.text)
                if match: age = match.group(1)
                
            # Value
            val_td = row.select_one("td.rechts.hauptlink")
            val = val_td.text.strip() if val_td else "-"
            
            players_data.append({
                "ad": name,
                "takim": team_name,
                "mevki": pos,
                "yas": age,
                "piyasa_degeri": val
            })
    except Exception as e:
        print(f"Error {team_name}: {e}")
        
    time.sleep(2)

print(f"Found {len(players_data)} players.")
with open('premier_league_2026.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)
    
# Remove any existing AV or Leeds just in case
filtered = [p for p in existing if p["takim"] not in ["Aston Villa", "Leeds United"]]
filtered.extend(players_data)

with open('premier_league_2026.json', 'w', encoding='utf-8') as f:
    json.dump(filtered, f, ensure_ascii=False, indent=4)
    
print("Updated premier_league_2026.json")
