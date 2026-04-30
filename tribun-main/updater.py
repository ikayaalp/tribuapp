import os
import sys
import json
import requests
import pandas as pd
import datetime
import unicodedata
import re
import difflib

# Add parent directory to path to allow importing engine
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from data.registry import DATA_FILES

API_KEY = "nhoWv5x2CBygbHrb2Q9mITWUbDQj8msfrKr3wlTuNLNnHzy8DoXBX6PfMRHd"
BASE_URL = "https://api.sportmonks.com/v3"

# Leagues we support
LEAGUES_CONFIG = {
    8: {"name": "Premier League", "csv": "premier_league_veriler_final.csv", "json": "premier_league_2026.json"},
    564: {"name": "La Liga", "csv": "la_liga_veriler_final.csv", "json": "la_liga_2026.json"},
    82: {"name": "Bundesliga", "csv": "bundesliga_veriler_final.csv", "json": "bundesliga_2026.json"},
    384: {"name": "Serie A", "csv": "serie_a_veriler_final.csv", "json": "serie_a_2026.json"},
    301: {"name": "Ligue 1", "csv": "ligue_1_veriler_final.csv", "json": "ligue_1_2026.json"},
    72: {"name": "Eredivisie", "csv": "eredivisie_veriler_final.csv", "json": "eredivisie_2026.json"},
    462: {"name": "Liga Portugal", "csv": "liga_portugal_veriler_final.csv", "json": "liga_portugal_2026.json"},
    600: {"name": "Super Lig", "csv": "superlig_veriler_final.csv", "json": "super_lig_2026.json"}
}

HUCUM_POSITIONS = ["Santrafor", "Sol Kanat", "Sağ Kanat", "İkinci Forvet"]
SAVUNMA_POSITIONS = ["Kaleci", "Stoper", "Sol Bek", "Sağ Bek", "Sol Bek", "Libero"]
ORTA_POSITIONS = ["Ön Libero", "Merkez Orta Saha", "On Numara", "Orta Saha Sağ", "Orta Saha Sol"]
SPORTMONKS_POS_MAP = {24: "Kaleci", 25: "Stoper", 26: "Merkez Orta Saha", 27: "Santrafor"}

def normalize_name(name):
    if not name: return ""
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_name = ''.join(c for c in nfkd if not unicodedata.combining(c))
    ascii_name = ascii_name.lower().strip()
    ascii_name = re.sub(r'[^a-z\s]', '', ascii_name)
    return ' '.join(ascii_name.split())

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

def load_tm_data(json_filename):
    json_path = os.path.join(BASE_DIR, "..", "betaı", json_filename)
    if not os.path.exists(json_path):
        return [], set()
    
    with open(json_path, "r", encoding="utf-8") as f:
        players = json.load(f)
        
    tm_teams = set()
    tm_players_list = []
    for p in players:
        tm_teams.add(p["takim"])
        tm_players_list.append({
            "name": p["ad"],
            "takim": p["takim"],
            "name_normalized": normalize_name(p["ad"]),
            "position": p["mevki"],
            "value_mil": parse_market_value(p["piyasa_degeri"])
        })
    return tm_players_list, tm_teams

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
    for tm in tm_teams:
        if norm_sm in normalize_name(tm) or normalize_name(tm) in norm_sm: return tm
    return None

def fetch_daily_matches(date_str):
    url = f"{BASE_URL}/football/fixtures/date/{date_str}"
    page = 1
    has_more = True
    fixtures = []
    
    print(f"[{date_str}] SportMonks verileri cekiliyor...")
    
    while has_more:
        params = {
            "api_token": API_KEY,
            "include": "sidelined.player;participants;scores;statistics;xgfixture;round;state",
            "page": page
        }
        resp = requests.get(url, params=params)
        if resp.status_code != 200:
            print(f"API Hatasi: {resp.status_code}")
            break
            
        data = resp.json()
        batch = data.get("data", [])
        
        # Filtrele: Sadece bizim ligler ve bitmis maclar
        for f in batch:
            if f.get("league_id") in LEAGUES_CONFIG:
                sn = f.get("state", {}).get("short_name", "")
                if sn in ["FT", "AET", "PEN_FT"]:
                    fixtures.append(f)
                    
        has_more = data.get("pagination", {}).get("has_more", False)
        page += 1
        
    return fixtures

def update_daily_data(target_date=None):
    if not target_date:
        # Default to yesterday
        d = datetime.date.today() - datetime.timedelta(days=1)
        target_date = d.strftime("%Y-%m-%d")
        
    fixtures = fetch_daily_matches(target_date)
    if not fixtures:
        print(f"[{target_date}] Guncellenecek populer bitmis mac bulunamadi.")
        return
        
    print(f"[{target_date}] {len(fixtures)} adet tamamlanmis mac bulundu. Isleme baslaniyor...")
    
    # Liglere gore grupla
    leagues_data = {}
    for lid in LEAGUES_CONFIG:
        leagues_data[lid] = []
        
    for f in fixtures:
        lid = f.get("league_id")
        leagues_data[lid].append(f)
        
    # Her lig icin CSV'yi guncelle
    for lid, matches in leagues_data.items():
        if not matches: continue
        
        config = LEAGUES_CONFIG[lid]
        csv_path = os.path.join(BASE_DIR, "datasets", config["csv"])
        
        if not os.path.exists(csv_path):
            print(f"UYARI: {csv_path} bulunamadi, atliyoruz.")
            continue
            
        # DataFrame yukle
        df = pd.read_csv(csv_path, encoding="utf-8-sig")
        tm_players_list, tm_teams = load_tm_data(config["json"])
        
        updated_count = 0
        added_count = 0
        
        for f in matches:
            # Temel bilgiler
            round_name = str(f.get('round', {}).get('name', '0'))
            try: rnum = int(re.sub(r'[^0-9]', '', round_name))
            except: rnum = 0
            
            participants = f.get('participants', [])
            if len(participants) < 2: continue
            
            home_p, away_p = participants[0], participants[1]
            for p in participants:
                if p.get("meta", {}).get("location") == "home": home_p = p
                elif p.get("meta", {}).get("location") == "away": away_p = p
            
            home_team_id = home_p.get("id")
            away_team_id = away_p.get("id")
            home_team = home_p.get("name")
            away_team = away_p.get("name")
            
            # Skorlar
            scores = f.get('scores', [])
            ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == home_team_id), None)
            ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == away_team_id), None)
            if ft_home is None:
                ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == home_team_id), 0)
                ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == away_team_id), 0)

            # Istatistikler
            home_xg, away_xg = 0.0, 0.0
            home_kk, away_kk = 0, 0
            home_pen, away_pen = 0, 0
            home_is, away_is = 0, 0
            home_ts, away_ts = 50, 50
            home_sut, away_sut = 0, 0
            home_kor, away_kor = 0, 0
            
            for s in f.get('xgfixture', []):
                if s.get('type_id') == 5304:
                    val = float(s.get('data', {}).get('value', 0))
                    if s.get('participant_id') == home_team_id: home_xg = val
                    elif s.get('participant_id') == away_team_id: away_xg = val
            
            for s in f.get('statistics', []):
                p_id = s.get('participant_id')
                val = float(s.get('data', {}).get('value', 0))
                t_id = s.get('type_id')
                
                if t_id == 5304 and home_xg == 0 and p_id == home_team_id: home_xg = val
                elif t_id == 5304 and away_xg == 0 and p_id == away_team_id: away_xg = val
                elif t_id == 83: 
                    if p_id == home_team_id: home_kk = int(val)
                    else: away_kk = int(val)
                elif t_id == 47:
                    if p_id == home_team_id: home_pen = int(val)
                    else: away_pen = int(val)
                elif t_id == 86:
                    if p_id == home_team_id: home_is = int(val)
                    else: away_is = int(val)
                elif t_id == 45:
                    if p_id == home_team_id: home_ts = int(val)
                    else: away_ts = int(val)
                elif t_id == 42:
                    if p_id == home_team_id: home_sut = int(val)
                    else: away_sut = int(val)
                elif t_id == 34:
                    if p_id == home_team_id: home_kor = int(val)
                    else: away_kor = int(val)

            # Eksik Oyuncular
            eh, es, eo = 0.0, 0.0, 0.0
            dh, ds, do_ = 0.0, 0.0, 0.0
            
            home_tm = match_team_fuzzy(home_team, tm_teams)
            away_tm = match_team_fuzzy(away_team, tm_teams)
            
            sidelined = f.get("sidelined", [])
            for s in sidelined:
                player = s.get("player", {})
                if not player: continue
                name = player.get("display_name") or player.get("name", "")
                norm_name = normalize_name(name)
                pos_id = player.get("position_id", 0)
                side = "home" if s.get("participant_id") == home_team_id else "away"
                tm_team = home_tm if side == "home" else away_tm
                
                p_val, p_pos = 0.0, None
                if tm_team:
                    for tp in tm_players_list:
                        if tp["takim"] == tm_team:
                            if tp["name_normalized"] == norm_name or norm_name in tp["name_normalized"].split():
                                p_val = tp["value_mil"]
                                p_pos = tp["position"]
                                break
                
                if not p_pos: p_pos = SPORTMONKS_POS_MAP.get(pos_id, "Bilinmiyor")
                cat = "hucum" if p_pos in HUCUM_POSITIONS else "savunma" if p_pos in SAVUNMA_POSITIONS else "orta" if p_pos in ORTA_POSITIONS else None
                
                if side == "home":
                    if cat == "hucum": eh += p_val
                    elif cat == "savunma": es += p_val
                    elif cat == "orta": eo += p_val
                else:
                    if cat == "hucum": dh += p_val
                    elif cat == "savunma": ds += p_val
                    elif cat == "orta": do_ += p_val

            new_row = {
                "Hafta": rnum,
                "Tarih": target_date,
                "Ev Sahibi": home_team,
                "Deplasman": away_team,
                "Skor": f"{int(ft_home)} - {int(ft_away)}",
                "Ev xG": round(home_xg, 4),
                "Dep xG": round(away_xg, 4),
                "Ev KK": home_kk,
                "Dep KK": away_kk,
                "Ev Pen": home_pen,
                "Dep Pen": away_pen,
                "Ev İŞ": home_is,
                "Dep İŞ": away_is,
                "Ev TS": home_ts,
                "Dep TS": away_ts,
                "Ev Şut": home_sut,
                "Dep Şut": away_sut,
                "Ev Kor": home_kor,
                "Dep Kor": away_kor,
                "Ev_Eksik_Hucum": round(eh, 2),
                "Ev_Eksik_Savunma": round(es, 2),
                "Ev_Eksik_Orta": round(eo, 2),
                "Dep_Eksik_Hucum": round(dh, 2),
                "Dep_Eksik_Savunma": round(ds, 2),
                "Dep_Eksik_Orta": round(do_, 2)
            }
            
            # Check if match exists
            # We match by Home Team and Away Team strings (roughly). We can use exact string match from SM since CSV has SM names.
            mask = (df["Ev Sahibi"] == home_team) & (df["Deplasman"] == away_team)
            
            if mask.any():
                idx = df.index[mask].tolist()[0]
                for k, v in new_row.items():
                    df.at[idx, k] = v
                updated_count += 1
            else:
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
                added_count += 1
                
        # Save CSV
        df.to_csv(csv_path, index=False, encoding="utf-8-sig")
        print(f"[BASARILI] {config['name']} -> {added_count} yeni eklendi, {updated_count} guncellendi.")
        
    print("\nCSV Guncelleme islemi tamamlandi! Modeli yeniden baslatmak uzere API'ye istek gonderiliyor...")
    try:
        r = requests.post("http://localhost:8000/optimize", json={"force": False})
        if r.status_code == 200:
            print("[BASARILI] Model optimizasyon & reload islemi tetiklendi. Sistem yenilendi!")
        else:
            print(f"API Yaniti Hatalı: {r.status_code} - {r.text}")
    except Exception as e:
        print("API tetiklenemedi. (FastAPI calismiyor olabilir):", e)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        update_daily_data(sys.argv[1]) # Ornegin: python updater.py 2026-04-30
    else:
        update_daily_data()
