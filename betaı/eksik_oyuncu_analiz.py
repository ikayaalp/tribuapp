import requests
import json
import pandas as pd
import re
import unicodedata
import time

# ==================== CONFIG ====================
API_KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNy"
BASE_URL = "https://api.sportmonks.com/v3"
SEASON_ID = 25682
TM_DATA_FILE = "super_lig_2026.json"
CSV_FILE = "superlig_27_hafta_raw.csv"
OUTPUT_FILE = "superlig_27_hafta_veriler.csv"

# ==================== TEAM NAME MAPPING ====================
# Maps CSV team names to Transfermarkt team names
CSV_TO_TM = {
    "Galatasaray": "Galatasaray SK",
    "Fenerbahçe": "Fenerbahçe SK",
    "Beşiktaş": "Beşiktaş JK",
    "Trabzonspor": "Trabzonspor",
    "İstanbul Başakşehir": "İstanbul Başakşehir FK",
    "Göztepe": "Göztepe",
    "Samsunspor": "Samsunspor",
    "Rizespor": "Çaykur Rizespor",
    "Konyaspor": "Konyaspor",
    "Alanyaspor": "Alanyaspor",
    "Gaziantep F.K.": "Gaziantep FK",
    "Kayserispor": "Kayserispor",
    "Kasımpaşa": "Kasımpaşa",
    "Gençlerbirliği": "Gençlerbirliği SK",
    "Kocaelispor": "Kocaelispor",
    "Antalyaspor": "Antalyaspor",
    "Fatih Karagümrük": "Fatih Karagümrük",
    "Eyüpspor": "Eyüpspor",
}

# Maps Sportmonks team names to CSV team names
SPORTMONKS_TO_CSV = {
    "Galatasaray": "Galatasaray",
    "Fenerbahce": "Fenerbahçe",
    "Fenerbahçe": "Fenerbahçe",
    "Besiktas": "Beşiktaş",
    "Beşiktaş JK": "Beşiktaş",
    "Trabzonspor": "Trabzonspor",
    "Istanbul Basaksehir FK": "İstanbul Başakşehir",
    "Istanbul Başakşehir FK": "İstanbul Başakşehir",
    "İstanbul Başakşehir FK": "İstanbul Başakşehir",
    "Basaksehir": "İstanbul Başakşehir",
    "Goztepe": "Göztepe",
    "Göztepe": "Göztepe",
    "Samsunspor": "Samsunspor",
    "Caykur Rizespor": "Rizespor",
    "Çaykur Rizespor": "Rizespor",
    "Rizespor": "Rizespor",
    "Konyaspor": "Konyaspor",
    "Alanyaspor": "Alanyaspor",
    "Gaziantep FK": "Gaziantep F.K.",
    "Gaziantep F.K.": "Gaziantep F.K.",
    "Kayserispor": "Kayserispor",
    "Kasimpasa": "Kasımpaşa",
    "Kasımpaşa": "Kasımpaşa",
    "Gençlerbirliği": "Gençlerbirliği",
    "Genclerbirligi": "Gençlerbirliği",
    "Kocaelispor": "Kocaelispor",
    "Antalyaspor": "Antalyaspor",
    "Fatih Karagümrük": "Fatih Karagümrük",
    "Fatih Karagumruk": "Fatih Karagümrük",
    "Eyupspor": "Eyüpspor",
    "Eyüpspor": "Eyüpspor",
}

# ==================== POSITION CATEGORIES ====================
HUCUM_POSITIONS = ["Santrafor", "Sol Kanat", "Sağ Kanat", "İkinci Forvet"]
SAVUNMA_POSITIONS = ["Kaleci", "Stoper", "Sol Bek", "Sağ Bek"]
ORTA_POSITIONS = ["Ön Libero", "Merkez Orta Saha", "On Numara", "Orta Saha Sağ", "Orta Saha Sol"]

# Sportmonks position_id to Transfermarkt-style category
SPORTMONKS_POS_MAP = {
    24: "Kaleci",       # Goalkeeper
    25: "Stoper",       # Defender
    26: "Merkez Orta Saha",  # Midfielder
    27: "Santrafor",    # Attacker/Forward
}

def parse_market_value(val_str):
    """Parse market value string to float (in millions)."""
    if not val_str or val_str == "-":
        return 0.0
    val_str = val_str.strip()
    if "mil." in val_str:
        num = val_str.replace("mil. €", "").replace("mil.€", "").strip().replace(",", ".")
        try:
            return float(num)
        except:
            return 0.0
    elif "bin" in val_str:
        num = val_str.replace("bin €", "").replace("bin€", "").strip().replace(",", ".")
        try:
            return float(num) / 1000.0
        except:
            return 0.0
    elif val_str.endswith("M"):
        try:
            return float(val_str[:-1])
        except:
            return 0.0
    elif val_str.endswith("K"):
        try:
            return float(val_str[:-1]) / 1000.0
        except:
            return 0.0
    return 0.0

def normalize_name(name):
    """Normalize a player name for matching."""
    if not name:
        return ""
    # Remove accents
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_name = ''.join(c for c in nfkd if not unicodedata.combining(c))
    # Lowercase, remove non-alpha
    ascii_name = ascii_name.lower().strip()
    ascii_name = re.sub(r'[^a-z\s]', '', ascii_name)
    # Remove extra whitespace
    ascii_name = ' '.join(ascii_name.split())
    return ascii_name

def load_tm_data():
    """Load Transfermarkt player data."""
    with open(TM_DATA_FILE, "r", encoding="utf-8") as f:
        players = json.load(f)
    
    # Build a lookup: {team_csv -> [{name, position, value_mil}, ...]}
    team_players = {}
    for p in players:
        tm_team = p["takim"]
        # Find CSV team name
        csv_team = None
        for csv_name, tm_name in CSV_TO_TM.items():
            if tm_name == tm_team:
                csv_team = csv_name
                break
        if not csv_team:
            # Try direct match
            csv_team = tm_team
        
        if csv_team not in team_players:
            team_players[csv_team] = []
        
        team_players[csv_team].append({
            "name": p["ad"],
            "name_normalized": normalize_name(p["ad"]),
            "position": p["mevki"],
            "value_mil": parse_market_value(p["piyasa_degeri"]),
        })
    
    print(f"Transfermarkt verileri yüklendi: {len(players)} oyuncu, {len(team_players)} takım")
    for t, ps in sorted(team_players.items()):
        print(f"  {t}: {len(ps)} oyuncu")
    return team_players

def fetch_all_sidelined_fixtures():
    """Fetch all fixtures with sidelined data for the season."""
    fixtures = []
    page = 1
    has_more = True
    
    print(f"\nSportmonks API'den sakatlık verileri çekiliyor (Sezon ID: {SEASON_ID})...")
    
    while has_more:
        url = f"{BASE_URL}/football/fixtures"
        params = {
            "api_token": API_KEY,
            "filters": f"fixtureSeasons:{SEASON_ID}",
            "include": "sidelined.player;participants;round",
            "page": page,
            "per_page": 25,
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        batch = data.get("data", [])
        fixtures.extend(batch)
        
        pagination = data.get("pagination", {})
        has_more = pagination.get("has_more", False)
        print(f"  Sayfa {page} çekildi ({len(batch)} maç, toplam: {len(fixtures)})")
        page += 1
    
    print(f"Toplam {len(fixtures)} maç çekildi.")
    return fixtures

def get_fixture_sidelined_map(fixtures):
    """
    Build a map: (home_csv, away_csv, week) -> {home_team_id, away_team_id, sidelined: [...]}
    """
    fixture_map = {}
    
    for f in fixtures:
        # Get participant info
        participants = f.get("participants", [])
        if len(participants) < 2:
            continue
        
        home_p = None
        away_p = None
        for p in participants:
            loc = p.get("meta", {}).get("location", "")
            if loc == "home":
                home_p = p
            elif loc == "away":
                away_p = p
        
        if not home_p or not away_p:
            home_p = participants[0]
            away_p = participants[1]
        
        home_name_sm = home_p.get("name", "")
        away_name_sm = away_p.get("name", "")
        home_id = home_p.get("id")
        away_id = away_p.get("id")
        
        # Map to CSV names
        home_csv = SPORTMONKS_TO_CSV.get(home_name_sm, home_name_sm)
        away_csv = SPORTMONKS_TO_CSV.get(away_name_sm, away_name_sm)
        
        # Round/Week
        round_info = f.get("round", {})
        week = round_info.get("name", "0")
        try:
            week_num = int(week)
        except:
            week_num = 0
        
        if week_num < 1 or week_num > 27:
            continue
        
        # Get sidelined players with team association
        sidelined = f.get("sidelined", [])
        sidelined_info = []
        for s in sidelined:
            player = s.get("player", {})
            if not player:
                continue
            
            player_name = player.get("display_name") or player.get("common_name") or player.get("name", "")
            player_id = player.get("id")
            participant_id = s.get("participant_id")  # Which team this player belongs to
            position_id = player.get("position_id", 0)
            
            side = "home" if participant_id == home_id else "away"
            
            sidelined_info.append({
                "name": player_name,
                "name_normalized": normalize_name(player_name),
                "participant_id": participant_id,
                "side": side,
                "position_id": position_id,
            })
        
        date_str = f.get("starting_at", "")[:10]
        key = (home_csv, away_csv, week_num)
        fixture_map[key] = {
            "home_csv": home_csv,
            "away_csv": away_csv,
            "week": week_num,
            "date": date_str,
            "sidelined": sidelined_info,
        }
    
    return fixture_map

def find_player_value(player_name_norm, team_players_list, position_id):
    """Find a player's value and position from TM data."""
    if not team_players_list:
        return 0.0, "Bilinmiyor"
    
    # Try exact match first
    for p in team_players_list:
        if p["name_normalized"] == player_name_norm:
            return p["value_mil"], p["position"]
    
    # Try last name match
    parts = player_name_norm.split()
    if parts:
        last_name = parts[-1]
        matches = [p for p in team_players_list if p["name_normalized"].endswith(last_name) and len(last_name) > 3]
        if len(matches) == 1:
            return matches[0]["value_mil"], matches[0]["position"]
    
    # Try first name match (for single-name players)
    if len(parts) == 1:
        matches = [p for p in team_players_list if parts[0] in p["name_normalized"].split()]
        if len(matches) == 1:
            return matches[0]["value_mil"], matches[0]["position"]
    
    # Fallback: use Sportmonks position_id for category, value = 0
    fallback_pos = SPORTMONKS_POS_MAP.get(position_id, "Bilinmiyor")
    return 0.0, fallback_pos

def categorize_position(position):
    """Categorize a position into hucum/savunma/orta."""
    if position in HUCUM_POSITIONS:
        return "hucum"
    elif position in SAVUNMA_POSITIONS:
        return "savunma"
    elif position in ORTA_POSITIONS:
        return "orta"
    return None

def calculate_missing_values(fixture_info, team_players, side="home"):
    """Calculate total missing value for each category for a given side."""
    team_csv = fixture_info["home_csv"] if side == "home" else fixture_info["away_csv"]
    tm_players = team_players.get(team_csv, [])
    
    hucum_total = 0.0
    savunma_total = 0.0
    orta_total = 0.0
    
    for s in fixture_info["sidelined"]:
        if s["side"] != side:
            continue
        
        value, position = find_player_value(s["name_normalized"], tm_players, s["position_id"])
        category = categorize_position(position)
        
        if category == "hucum":
            hucum_total += value
        elif category == "savunma":
            savunma_total += value
        elif category == "orta":
            orta_total += value
    
    return hucum_total, savunma_total, orta_total

def main():
    # 1. Load Transfermarkt data
    team_players = load_tm_data()
    
    # 2. Fetch sidelined data from API
    fixtures = fetch_all_sidelined_fixtures()
    fixture_map = get_fixture_sidelined_map(fixtures)
    
    print(f"\nToplam {len(fixture_map)} maç eşleştirildi.")
    
    # 3. Load CSV
    df = pd.read_csv(CSV_FILE, encoding="utf-8-sig")
    print(f"CSV yüklendi: {len(df)} satır")
    
    # Initialize new columns
    ev_hucum = []
    ev_savunma = []
    ev_orta = []
    dep_hucum = []
    dep_savunma = []
    dep_orta = []
    
    matched = 0
    unmatched = 0
    
    for idx, row in df.iterrows():
        hafta = int(row["Hafta"])
        ev = row["Ev Sahibi"]
        dep = row["Deplasman"]
        
        key = (ev, dep, hafta)
        
        if key in fixture_map:
            finfo = fixture_map[key]
            eh, es, eo = calculate_missing_values(finfo, team_players, "home")
            dh, ds, do_ = calculate_missing_values(finfo, team_players, "away")
            matched += 1
        else:
            eh, es, eo = 0.0, 0.0, 0.0
            dh, ds, do_ = 0.0, 0.0, 0.0
            unmatched += 1
        
        ev_hucum.append(round(eh, 2))
        ev_savunma.append(round(es, 2))
        ev_orta.append(round(eo, 2))
        dep_hucum.append(round(dh, 2))
        dep_savunma.append(round(ds, 2))
        dep_orta.append(round(do_, 2))
    
    # 4. Add columns to DataFrame
    df["Ev_Eksik_Hucum"] = ev_hucum
    df["Ev_Eksik_Savunma"] = ev_savunma
    df["Ev_Eksik_Orta"] = ev_orta
    df["Dep_Eksik_Hucum"] = dep_hucum
    df["Dep_Eksik_Savunma"] = dep_savunma
    df["Dep_Eksik_Orta"] = dep_orta
    
    # 5. Save CSV
    df.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    print(f"\n✅ CSV güncellendi: {OUTPUT_FILE}")
    print(f"  Eşleşen: {matched}, Eşleşmeyen: {unmatched}")
    
    # Show some sample data
    print(f"\n--- Örnek Veriler ---")
    sample = df[["Hafta", "Ev Sahibi", "Deplasman", "Ev_Eksik_Hucum", "Ev_Eksik_Savunma", "Ev_Eksik_Orta", "Dep_Eksik_Hucum", "Dep_Eksik_Savunma", "Dep_Eksik_Orta"]]
    # Show rows where at least one value is > 0
    nonzero = sample[(sample["Ev_Eksik_Hucum"] > 0) | (sample["Ev_Eksik_Savunma"] > 0) | (sample["Ev_Eksik_Orta"] > 0)]
    if len(nonzero) > 0:
        print(nonzero.head(15).to_string(index=False))
    else:
        print("Hiçbir maçta eksik oyuncu sakatlık verisi bulunamadı.")
        print("API planınız 'sidelined' verisi içermiyor olabilir.")

if __name__ == "__main__":
    main()
