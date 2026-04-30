import requests
import pandas as pd

# API Configuration
API_KEY = "nUO9dEc5YXoXsZpPa1XoutAMaxo2GHSxzIg272q8jH8qtCsLMTRsyi8WajQa"
BASE_URL = "https://api.sportmonks.com/v3"

LEAGUES = [
    {"id": 72, "name": "Eredivisie", "filename": "eredivisie_raw.csv"},
    {"id": 462, "name": "Liga Portugal", "filename": "liga_portugal_raw.csv"}
]

def get_current_season_id(league_id):
    if league_id == 501: # Liga Portugal
        return 25598
    url = f"{BASE_URL}/football/leagues/{league_id}?include=currentSeason"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    if data and data.get("data") and data["data"].get("currentseason"):
        return data['data']['currentseason']['id']
    
    # Fallback to fetching seasons and sorting
    url2 = f"{BASE_URL}/football/seasons"
    params2 = {"api_token": API_KEY, "filters": f"seasonLeagues:{league_id}"}
    response2 = requests.get(url2, params2)
    seasons = response2.json().get("data", [])
    if seasons:
        for s in seasons:
            if "2025/2026" in s.get("name", ""): return s["id"]
        return seasons[-1]["id"]
    return None

def fetch_all_fixtures(season_id, league_name):
    fixtures = []
    page = 1
    has_more = True
    url = f"{BASE_URL}/football/fixtures"
    
    print(f"{league_name} maç verileri çekiliyor (Sezon ID: {season_id})...")
    
    while has_more:
        params = {
            "api_token": API_KEY,
            "filters": f"fixtureSeasons:{season_id}",
            "include": "participants;scores;round;statistics;xGFixture",
            "page": page,
            "per_page": 50
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        batch = data.get('data', [])
        fixtures.extend(batch)
        
        pagination = data.get('pagination', {})
        has_more = pagination.get('has_more', False)
        page += 1
        
    return fixtures

def process_data(fixtures):
    records = []
    for f in fixtures:
        round_info = f.get('round', {})
        round_name = round_info.get('name', '0')
        try:
            rnum = int(round_name)
            if rnum < 1: continue
        except: continue
        
        participants = f.get('participants', [])
        if len(participants) < 2: continue
        
        home_team_id, away_team_id = None, None
        home_team, away_team = "Unknown", "Unknown"
        
        for p in participants:
            if p.get('meta', {}).get('location') == 'home':
                home_team_id = p.get('id')
                home_team = p.get('name')
            elif p.get('meta', {}).get('location') == 'away':
                away_team_id = p.get('id')
                away_team = p.get('name')
        
        if not home_team_id or not away_team_id:
            home_team_id = participants[0].get('id')
            away_team_id = participants[1].get('id')
            home_team = participants[0].get('name')
            away_team = participants[1].get('name')

        scores = f.get('scores', [])
        ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == home_team_id), None)
        ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == away_team_id), None)
        
        if ft_home is None or ft_away is None:
            ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == home_team_id), None)
            ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == away_team_id), None)

        if ft_home is None or ft_away is None:
            # maç oynanmadı (gelecek fikstür) atla
            continue
            
        home_score = ft_home if ft_home is not None else 0
        away_score = ft_away if ft_away is not None else 0

        home_xg, away_xg = 0.0, 0.0
        home_bc, away_bc = 0, 0
        home_kk, away_kk = 0, 0
        home_pen, away_pen = 0, 0
        home_is, away_is = 0, 0
        home_ts, away_ts = 0, 0
        home_sut, away_sut = 0, 0
        home_kor, away_kor = 0, 0
        
        xg_stats = f.get('xgfixture', [])
        for s in xg_stats:
            if s.get('type_id') == 5304:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_xg = float(val)
                elif p_id == away_team_id: away_xg = float(val)
        
        std_stats = f.get('statistics', [])
        for s in std_stats:
            p_id = s.get('participant_id')
            val = s.get('data', {}).get('value', 0)
            t_id = s.get('type_id')
            
            if t_id == 581: home_bc = int(val) if p_id == home_team_id else home_bc
            elif t_id == 581: away_bc = int(val) if p_id == away_team_id else away_bc
            elif t_id == 5304 and home_xg == 0: home_xg = float(val) if p_id == home_team_id else home_xg
            elif t_id == 5304 and away_xg == 0: away_xg = float(val) if p_id == away_team_id else away_xg
            elif t_id == 83: home_kk = int(val) if p_id == home_team_id else home_kk
            elif t_id == 83: away_kk = int(val) if p_id == away_team_id else away_kk
            elif t_id == 47: home_pen = int(val) if p_id == home_team_id else home_pen
            elif t_id == 47: away_pen = int(val) if p_id == away_team_id else away_pen
            elif t_id == 86: home_is = int(val) if p_id == home_team_id else home_is
            elif t_id == 86: away_is = int(val) if p_id == away_team_id else away_is
            elif t_id == 45: home_ts = int(val) if p_id == home_team_id else home_ts
            elif t_id == 45: away_ts = int(val) if p_id == away_team_id else away_ts
            elif t_id == 42: home_sut = int(val) if p_id == home_team_id else home_sut
            elif t_id == 42: away_sut = int(val) if p_id == away_team_id else away_sut
            elif t_id == 34: home_kor = int(val) if p_id == home_team_id else home_kor
            elif t_id == 34: away_kor = int(val) if p_id == away_team_id else away_kor

        disp_home_xg = home_xg if home_xg > 0 else float(home_bc)
        disp_away_xg = away_xg if away_xg > 0 else float(away_bc)
        tarih = f.get('starting_at', '').split(' ')[0] if f.get('starting_at') else "Bilinmiyor"

        records.append({
            "Hafta": rnum,
            "Tarih": tarih,
            "Ev Sahibi": home_team,
            "Deplasman": away_team,
            "Skor": f"{home_score} - {away_score}",
            "Ev xG": disp_home_xg,
            "Dep xG": disp_away_xg,
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
            "Dep Kor": away_kor
        })
            
    return records

def save_league_data(league):
    try:
        season_id = get_current_season_id(league['id'])
        if not season_id:
            print(f"Hata: {league['name']} için Season ID bulunamadı.")
            return
            
        fixtures = fetch_all_fixtures(season_id, league['name'])
        records = process_data(fixtures)
        
        if not records:
            print(f"{league['name']} için oynanmış maç bulunamadı.")
            return

        df = pd.DataFrame(records)
        df = df.sort_values(['Hafta', 'Ev Sahibi'])
        
        csv_filename = league['filename']
        df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
        
        print(f"✅ {league['name']} verileri '{csv_filename}' ({len(df)} maç) dosyasına başarıyla kaydedildi.\n")

    except Exception as e:
        print(f"Hata ({league['name']}): {e}")

def main():
    for league in LEAGUES:
        save_league_data(league)

if __name__ == "__main__":
    main()
