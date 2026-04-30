import requests
import json
import pandas as pd
import re
import unicodedata
import os
import difflib

# ==================== CONFIG ====================
API_KEY = "nUO9dEc5YXoXsZpPa1XoutAMaxo2GHSxzIg272q8jH8qtCsLMTRsyi8WajQa"
BASE_URL = "https://api.sportmonks.com/v3"

LEAGUES_CONFIG = [
    {"name": "Premier League", "lid": 8, "json": "premier_league_2026.json", "csv_in": "premier_league_raw.csv", "csv_out": "premier_league_veriler_final.csv"},
    {"name": "La Liga", "lid": 564, "json": "la_liga_2026.json", "csv_in": "la_liga_raw.csv", "csv_out": "la_liga_veriler_final.csv"},
    {"name": "Bundesliga", "lid": 82, "json": "bundesliga_2026.json", "csv_in": "bundesliga_raw.csv", "csv_out": "bundesliga_veriler_final.csv"},
    {"name": "Serie A", "lid": 384, "json": "serie_a_2026.json", "csv_in": "serie_a_raw.csv", "csv_out": "serie_a_veriler_final.csv"},
    {"name": "Ligue 1", "lid": 301, "json": "ligue_1_2026.json", "csv_in": "ligue_1_raw.csv", "csv_out": "ligue_1_veriler_final.csv"},
    {"name": "Eredivisie", "lid": 72, "json": "eredivisie_2026.json", "csv_in": "eredivisie_raw.csv", "csv_out": "eredivisie_veriler_final.csv"},
    {"name": "Liga Portugal", "lid": 462, "json": "liga_portugal_2026.json", "csv_in": "liga_portugal_raw.csv", "csv_out": "liga_portugal_veriler_final.csv"},
    {"name": "Super Lig", "lid": 600, "json": "super_lig_2026.json", "csv_in": "superlig_raw.csv", "csv_out": "superlig_veriler_final.csv"}
]

# ==================== POSITION CATEGORIES ====================
HUCUM_POSITIONS = ["Santrafor", "Sol Kanat", "Sağ Kanat", "İkinci Forvet"]
SAVUNMA_POSITIONS = ["Kaleci", "Stoper", "Sol Bek", "Sağ Bek", "Sol Bek", "Libero"]
ORTA_POSITIONS = ["Ön Libero", "Merkez Orta Saha", "On Numara", "Orta Saha Sağ", "Orta Saha Sol"]

SPORTMONKS_POS_MAP = {
    24: "Kaleci",       
    25: "Stoper",       
    26: "Merkez Orta Saha",  
    27: "Santrafor",    
}

def get_current_season_id(league_id):
    url = f"{BASE_URL}/football/leagues/{league_id}?include=currentSeason"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    if data and data.get("data") and data["data"].get("currentseason"):
        return data["data"]["currentseason"]["id"]
    
    # Fallback to fetching seasons and sorting
    url2 = f"{BASE_URL}/football/seasons"
    params2 = {"api_token": API_KEY, "filters": f"seasonLeagues:{league_id}"}
    response2 = requests.get(url2, params2)
    seasons = response2.json().get("data", [])
    if seasons:
        # En iyisi en sonuncudur veya 25/26 olan
        for s in seasons:
            if "2025/2026" in s.get("name", ""): return s["id"]
        return seasons[-1]["id"]
    return None

def parse_market_value(val_str):
    if not val_str or val_str == "-": return 0.0
    val_str = val_str.strip()
    if "mil." in val_str:
        num = val_str.replace("mil. €", "").replace("mil.€", "").strip().replace(",", ".")
        try: return float(num)
        except: return 0.0
    elif "bin" in val_str:
        num = val_str.replace("bin €", "").replace("bin€", "").strip().replace(",", ".")
        try: return float(num) / 1000.0
        except: return 0.0
    elif val_str.endswith("M"):
        try: return float(val_str[:-1])
        except: return 0.0
    elif val_str.endswith("K"):
        try: return float(val_str[:-1]) / 1000.0
        except: return 0.0
    return 0.0

def normalize_name(name):
    if not name: return ""
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_name = ''.join(c for c in nfkd if not unicodedata.combining(c))
    ascii_name = ascii_name.lower().strip()
    ascii_name = re.sub(r'[^a-z\s]', '', ascii_name)
    return ' '.join(ascii_name.split())

def match_team_fuzzy(sm_team, tm_teams):
    if sm_team in tm_teams: return sm_team
    
    norm_sm = normalize_name(sm_team)
    for tm in tm_teams:
        if normalize_name(tm) == norm_sm: return tm
        
    matches = difflib.get_close_matches(norm_sm, [normalize_name(t) for t in tm_teams], n=1, cutoff=0.6)
    if matches:
        match = matches[0]
        for tm in tm_teams:
            if normalize_name(tm) == match: return tm
            
    # Substring match
    for tm in tm_teams:
        if norm_sm in normalize_name(tm) or normalize_name(tm) in norm_sm: return tm
        
    return None

def process_league(config):
    league_name = config["name"]
    json_file = config["json"]
    csv_in = config["csv_in"]
    csv_out = config["csv_out"]
    lid = config["lid"]
    
    if not os.path.exists(json_file):
        print(f"BİLGİ: {json_file} bulunamadı, {league_name} atlanıyor.")
        return
        
    if not os.path.exists(csv_in):
        print(f"BİLGİ: {csv_in} bulunamadı, {league_name} atlanıyor.")
        return
        
    season_id = get_current_season_id(lid)
    if not season_id:
        print(f"HATA: {league_name} için Sezon ID bulunamadı.")
        return
        
    print(f"\n[{league_name}] İşleniyor (Sezon ID: {season_id})...")
    
    # Load JSON
    with open(json_file, "r", encoding="utf-8") as f:
        players = json.load(f)
        
    tm_teams = set()
    tm_players_list = []
    for p in players:
        tm_teams.add(p["takim"])
        tm_players_list.append({
            "ad": p["ad"],
            "takim": p["takim"],
            "name_normalized": normalize_name(p["ad"]),
            "position": p["mevki"],
            "value_mil": parse_market_value(p["piyasa_degeri"])
        })
        
    # Fetch Sidelined
    fixtures = []
    page = 1
    has_more = True
    while has_more:
        url = f"{BASE_URL}/football/fixtures"
        params = {"api_token": API_KEY, "filters": f"fixtureSeasons:{season_id}", "include": "sidelined.player;participants;round", "page": page, "per_page": 50}
        resp = requests.get(url, params=params)
        data = resp.json()
        batch = data.get("data", [])
        fixtures.extend(batch)
        has_more = data.get("pagination", {}).get("has_more", False)
        page += 1
        
    fixture_map = {}
    team_mapping_cache = {} # Cache SM to TM matches
    
    for f in fixtures:
        participants = f.get("participants", [])
        if len(participants) < 2: continue
        
        home_p, away_p = participants[0], participants[1]
        for p in participants:
            if p.get("meta", {}).get("location") == "home": home_p = p
            elif p.get("meta", {}).get("location") == "away": away_p = p
                
        home_sm = home_p.get("name", "")
        away_sm = away_p.get("name", "")
        
        if home_sm not in team_mapping_cache:
            team_mapping_cache[home_sm] = match_team_fuzzy(home_sm, tm_teams)
        if away_sm not in team_mapping_cache:
            team_mapping_cache[away_sm] = match_team_fuzzy(away_sm, tm_teams)
            
        home_tm = team_mapping_cache[home_sm]
        away_tm = team_mapping_cache[away_sm]
        
        week = 0
        try: week = int(f.get("round", {}).get("name", "0"))
        except: pass
        if week < 1: continue
        
        sidelined = f.get("sidelined", [])
        sidelined_info = []
        for s in sidelined:
            player = s.get("player", {})
            if not player: continue
            name = player.get("display_name") or player.get("name", "")
            pid = player.get("position_id", 0)
            side = "home" if s.get("participant_id") == home_p.get("id") else "away"
            tm_team = home_tm if side == "home" else away_tm
            
            sidelined_info.append({"name": name, "norm_name": normalize_name(name), "pos_id": pid, "side": side, "tm_team": tm_team})
            
        key = (home_sm, away_sm, week)
        fixture_map[key] = sidelined_info
        
    # Process CSV
    df = pd.read_csv(csv_in, encoding="utf-8-sig")
    
    # Initialize columns
    for col in ["Ev_Eksik_Hucum", "Ev_Eksik_Savunma", "Ev_Eksik_Orta", "Dep_Eksik_Hucum", "Dep_Eksik_Savunma", "Dep_Eksik_Orta"]:
        if col not in df.columns:
            df[col] = 0.0
            
    for idx, row in df.iterrows():
        try: week = int(row["Hafta"])
        except: continue
        
        ev_sm = row["Ev Sahibi"]
        dep_sm = row["Deplasman"]
        key = (ev_sm, dep_sm, week)
        
        if key in fixture_map:
            eh, es, eo = 0.0, 0.0, 0.0
            dh, ds, do_ = 0.0, 0.0, 0.0
            
            for s in fixture_map[key]:
                if not s["tm_team"]: continue
                # Find player in TM
                p_val, p_pos = 0.0, None
                for tp in tm_players_list:
                    if tp["takim"] == s["tm_team"]:
                        if tp["name_normalized"] == s["norm_name"] or s["norm_name"] in tp["name_normalized"].split():
                            p_val = tp["value_mil"]
                            p_pos = tp["position"]
                            break
                            
                if not p_pos:
                    p_pos = SPORTMONKS_POS_MAP.get(s["pos_id"], "Bilinmiyor")
                    
                cat = "hucum" if p_pos in HUCUM_POSITIONS else "savunma" if p_pos in SAVUNMA_POSITIONS else "orta" if p_pos in ORTA_POSITIONS else None
                
                if s["side"] == "home":
                    if cat == "hucum": eh += p_val
                    elif cat == "savunma": es += p_val
                    elif cat == "orta": eo += p_val
                else:
                    if cat == "hucum": dh += p_val
                    elif cat == "savunma": ds += p_val
                    elif cat == "orta": do_ += p_val
                    
            df.at[idx, "Ev_Eksik_Hucum"] = round(eh, 2)
            df.at[idx, "Ev_Eksik_Savunma"] = round(es, 2)
            df.at[idx, "Ev_Eksik_Orta"] = round(eo, 2)
            df.at[idx, "Dep_Eksik_Hucum"] = round(dh, 2)
            df.at[idx, "Dep_Eksik_Savunma"] = round(ds, 2)
            df.at[idx, "Dep_Eksik_Orta"] = round(do_, 2)
            
    df.to_csv(csv_out, index=False, encoding='utf-8-sig')
    print(f"✅ {league_name} tamamlandı -> {csv_out}")

if __name__ == "__main__":
    for conf in LEAGUES_CONFIG:
        process_league(conf)
