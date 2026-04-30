import json
import os
import glob
import pandas as pd
import unicodedata
import re
import difflib

def parse_market_value(val_str):
    if not val_str or val_str == "-": return 0.0
    val_str = val_str.strip()
    if "mil." in val_str:
        num = val_str.replace("mil. €", "").replace("mil.€", "").strip().replace(",", ".")
        try: return float(num) * 1000000.0
        except: return 0.0
    elif "bin" in val_str:
        num = val_str.replace("bin €", "").replace("bin€", "").strip().replace(",", ".")
        try: return float(num) * 1000.0
        except: return 0.0
    elif val_str.endswith("M"):
        try: return float(val_str[:-1]) * 1000000.0
        except: return 0.0
    elif val_str.endswith("K"):
        try: return float(val_str[:-1]) * 1000.0
        except: return 0.0
    return 0.0

def normalize_name(name):
    if not name: return ""
    nfkd = unicodedata.normalize('NFKD', str(name))
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

def main():
    # 1. Transfermarkt verilerini topla
    json_files = glob.glob("*_2026.json")
    tm_team_values = {}
    
    for jf in json_files:
        with open(jf, "r", encoding="utf-8") as f:
            players = json.load(f)
            
        for p in players:
            team = p["takim"]
            val_eur = parse_market_value(p.get("piyasa_degeri", ""))
            
            if team not in tm_team_values:
                tm_team_values[team] = 0.0
            tm_team_values[team] += val_eur
            
    tm_teams = list(tm_team_values.keys())
    
    # 2. Sportmonks takımlarını topla
    sm_teams = set()
    for raw_csv in glob.glob("*_raw.csv"):
        try:
            df_sm = pd.read_csv(raw_csv, encoding='utf-8-sig')
            if 'Ev Sahibi' in df_sm.columns:
                sm_teams.update(df_sm["Ev Sahibi"].dropna().unique())
            if 'Deplasman' in df_sm.columns:
                sm_teams.update(df_sm["Deplasman"].dropna().unique())
        except Exception as e:
            continue
            
    # 3. Sportmonks adlarını Transfermarkt adlarıyla eşleştir
    records = []
    mapped_tms = set()
    
    for sm_team in sm_teams:
        tm_team = match_team_fuzzy(sm_team, tm_teams)
        if tm_team:
            val = tm_team_values[tm_team]
            records.append({"Takim": sm_team, "PiyasaDegeri": int(val)})
            mapped_tms.add(tm_team)
        else:
            # Eşleşme yoksa değeri 0 yap veya olduğu gibi bırak
            records.append({"Takim": sm_team, "PiyasaDegeri": 0})
            
    # Eğer SM CSV'lerinde olmayan ama TM verisinde olan fazladan takım kaldıysa (örn. yeni çıkmış veya hata)
    for tm_team, val in tm_team_values.items():
        if tm_team not in mapped_tms:
            # SM adını bilmediğimiz için direkt TM adını yaz
            records.append({"Takim": tm_team, "PiyasaDegeri": int(val)})
            
    df = pd.DataFrame(records)
    # Unique yap garantilemek için (Aynı SM adından gelmişse)
    df = df.drop_duplicates(subset=["Takim"], keep="first")
    df = df.sort_values(by="PiyasaDegeri", ascending=False)
    
    df.to_csv("takim_degerleri.csv", index=False, encoding="utf-8-sig")
    print("Mali değerler (Sportmonks isimleriyle) takim_degerleri.csv'ye yazıldı. (Toplam takım:", len(df), ")")

if __name__ == "__main__":
    main()
