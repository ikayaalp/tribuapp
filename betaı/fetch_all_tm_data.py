import requests
from bs4 import BeautifulSoup
import json
import time
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

LEAGUES = {
    "Premier League": "GB1",
    "La Liga": "ES1",
    "Bundesliga": "L1",
    "Serie A": "IT1",
    "Ligue 1": "FR1",
    "Eredivisie": "NL1",
    "Liga Portugal": "PO1",
    "Super Lig": "TR1"
}

def get_soup(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return BeautifulSoup(resp.content, "html.parser")
    except Exception as e:
        print(f"Hata URL: {url} -> {e}")
        return None

def fetch_league_clubs(league_id, season="2025"):
    url = f"https://www.transfermarkt.com.tr/jump/startseite/wettbewerb/{league_id}/plus/?saison_id={season}"
    soup = get_soup(url)
    if not soup: return []
    
    table = soup.find("table", class_="items")
    if not table: return []
    
    clubs = []
    for row in table.find("tbody").find_all("tr"):
        tds = row.find_all("td")
        if len(tds) < 2: continue
        
        link_tag = tds[1].find("a") if len(tds)>1 else None
        if not link_tag:
            link_tag = row.find("td", class_="hauptlink").find("a") if row.find("td", class_="hauptlink") else None
            
        if link_tag and link_tag.get("href"):
            href = link_tag.get("href")
            club_url = f"https://www.transfermarkt.com.tr{href}"
            club_name = link_tag.text.strip()
            club_url = club_url.replace("/spielplan/", "/kader/").replace("/startseite/", "/kader/")
            clubs.append({"name": club_name, "url": club_url})
            
    return clubs

def fetch_club_players(club_url, club_name):
    if "/plus/" not in club_url:
        club_url += "/plus/1"
        
    soup = get_soup(club_url)
    if not soup: return []
    
    players = []
    table = soup.find("table", class_="items")
    if not table: return []
    
    for row in table.find("tbody").find_all("tr", recursive=False):
        tds = row.find_all("td", recursive=False)
        if len(tds) < 5: continue
        
        haupt_tds = row.find_all("td", class_="hauptlink")
        ad = haupt_tds[0].text.strip() if haupt_tds else ""
        
        deger = ""
        for td in row.find_all("td", class_="rechts hauptlink"):
            deger = td.text.strip()
            
        mevki = ""
        inline_table = row.find("table", class_="inline-table")
        if inline_table:
            trs = inline_table.find_all("tr")
            if len(trs) > 1:
                mevki = trs[1].text.strip()
                
        zentriert = row.find_all("td", class_="zentriert")
        yas = ""
        for z in zentriert:
            txt = z.text.strip()
            if "(" in txt and ")" in txt:
                try:
                    yas = txt.split("(")[-1].replace(")", "").strip()
                except:
                    pass
                break
            elif len(txt) == 2 and txt.isdigit():
                yas = txt
                break
                
        if ad and deger and deger != "-":
            players.append({
                "ad": ad,
                "mevki": mevki,
                "takim": club_name,
                "yas": yas,
                "piyasa_degeri": deger
            })
            
    return players

def scrape_league(league_name, league_id, season="2025"):
    filename = f"{league_name.lower().replace(' ', '_')}_2026.json"
    if os.path.exists(filename):
        print(f"⏩ {league_name} zaten çekilmiş ({filename}). Atlanıyor...")
        return
        
    print(f"--- {league_name} ({league_id}) Çekiliyor ---")
    clubs = fetch_league_clubs(league_id, season)
    if not clubs:
        print(f"❌ {league_name} takımları bulunamadı!")
        return
        
    print(f"{len(clubs)} takım bulundu.")
    
    all_players = []
    for c in clubs:
        print(f"  -> {c['name']} çekiliyor...")
        players = fetch_club_players(c['url'], c['name'])
        all_players.extend(players)
        time.sleep(1) # TM banlanmamak için 1 saniye bekleme
        
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(all_players, f, indent=4, ensure_ascii=False)
        
    print(f"✅ {league_name} tamamlandı. {len(all_players)} oyuncu '{filename}' dosyasına kaydedildi.\n")

if __name__ == "__main__":
    for name, code in LEAGUES.items():
        scrape_league(name, code, "2025")
