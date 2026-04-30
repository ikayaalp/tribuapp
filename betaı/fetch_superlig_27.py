import requests
import pandas as pd
import json

# Working API Key
API_KEY = "e5WscEtHTK8QyCUlnyMiyRgczdp8tya8xw2XgAAcPgcPAhImzt0X8KQntQNy"
BASE_URL = "https://api.sportmonks.com/v3"
LEAGUE_ID = 600

def get_current_season_id():
    url = f"{BASE_URL}/football/leagues/{LEAGUE_ID}?include=currentSeason"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    return data['data']['currentseason']['id']

def fetch_all_fixtures(season_id):
    fixtures = []
    page = 1
    has_more = True
    url = f"{BASE_URL}/football/fixtures"
    print(f"Süper Lig verileri çekiliyor (Sezon ID: {season_id})...")
    
    while has_more:
        params = {
            "api_token": API_KEY,
            "filters": f"fixtureSeasons:{season_id}",
            "include": "participants;scores;round;statistics;xGFixture",
            "page": page
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        batch = data.get('data', [])
        fixtures.extend(batch)
        pagination = data.get('pagination', {})
        has_more = pagination.get('has_more', False)
        print(f"Sayfa {page} çekildi. (Toplam maç: {len(fixtures)})")
        page += 1
    return fixtures

def process_data(fixtures):
    records = []
    for f in fixtures:
        round_info = f.get('round', {})
        round_name = round_info.get('name', 'N/A')
        
        participants = f.get('participants', [])
        home_team_id, away_team_id = None, None
        home_team, away_team = "Unknown", "Unknown"
        
        for p in participants:
            if p.get('meta', {}).get('location') == 'home':
                home_team_id, home_team = p.get('id'), p.get('name')
            elif p.get('meta', {}).get('location') == 'away':
                away_team_id, away_team = p.get('id'), p.get('name')
        
        if not home_team_id or not away_team_id:
            if len(participants) >= 2:
                home_team_id, away_team_id = participants[0].get('id'), participants[1].get('id')
                home_team, away_team = participants[0].get('name'), participants[1].get('name')
            else: continue

        scores = f.get('scores', [])
        ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == home_team_id), None)
        ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == away_team_id), None)
        if ft_home is None or ft_away is None:
            ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == home_team_id), None)
            ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == away_team_id), None)
        home_score, away_score = (ft_home if ft_home is not None else 0), (ft_away if ft_away is not None else 0)

        home_xg, away_xg, home_bc, away_bc = 0.0, 0.0, 0, 0
        home_kk, away_kk, home_pen, away_pen = 0, 0, 0, 0
        home_is, away_is, home_ts, away_ts = 0, 0, 0, 0
        home_sut, away_sut, home_kor, away_kor = 0, 0, 0, 0
        
        # xG in xGFixture
        for s in f.get('xgfixture', []):
            if s.get('type_id') == 5304:
                if s.get('participant_id') == home_team_id: home_xg = float(s.get('data', {}).get('value', 0))
                elif s.get('participant_id') == away_team_id: away_xg = float(s.get('data', {}).get('value', 0))
        
        # Others in statistics
        for s in f.get('statistics', []):
            p_id = s.get('participant_id')
            val = s.get('data', {}).get('value', 0)
            t_id = s.get('type_id')
            if t_id == 581: # Big Chances
                if p_id == home_team_id: home_bc = int(val)
                else: away_bc = int(val)
            elif t_id == 5304 and home_xg == 0:
                if p_id == home_team_id: home_xg = float(val)
                else: away_xg = float(val)
            elif t_id == 83: # Redcards
                if p_id == home_team_id: home_kk = int(val)
                else: away_kk = int(val)
            elif t_id == 47: # Pen
                if p_id == home_team_id: home_pen = int(val)
                else: away_pen = int(val)
            elif t_id == 86: # IS
                if p_id == home_team_id: home_is = int(val)
                else: away_is = int(val)
            elif t_id == 45: # TS
                if p_id == home_team_id: home_ts = int(val)
                else: away_ts = int(val)
            elif t_id == 42: # Sut
                if p_id == home_team_id: home_sut = int(val)
                else: away_sut = int(val)
            elif t_id == 34: # Korner
                if p_id == home_team_id: home_kor = int(val)
                else: away_kor = int(val)

        disp_home_xg = home_xg if home_xg > 0 else float(home_bc)
        disp_away_xg = away_xg if away_xg > 0 else float(away_bc)
        tarih = f.get('starting_at', '').split(' ')[0] if f.get('starting_at') else "Bilinmiyor"

        records.append({
            "Hafta": round_name, "Tarih": tarih, "Ev Sahibi": home_team, "Deplasman": away_team,
            "Skor": f"{home_score} - {away_score}", "Ev xG": disp_home_xg, "Dep xG": disp_away_xg,
            "Ev KK": home_kk, "Dep KK": away_kk, "Ev Pen": home_pen, "Dep Pen": away_pen,
            "Ev İŞ": home_is, "Dep İŞ": away_is, "Ev TS": home_ts, "Dep TS": away_ts,
            "Ev Şut": home_sut, "Dep Şut": away_sut, "Ev Kor": home_kor, "Dep Kor": away_kor
        })
    return records

def main():
    season_id = get_current_season_id()
    fixtures = fetch_all_fixtures(season_id)
    records = process_data(fixtures)
    df = pd.DataFrame(records)
    try:
        df['HaftaNum'] = df['Hafta'].str.extract('(\d+)').astype(float).fillna(0).astype(int)
        df = df[(df['HaftaNum'] >= 1) & (df['HaftaNum'] <= 27)]
        df = df.sort_values(['HaftaNum', 'Ev Sahibi'])
    except Exception as e: print(f"Sıralama hatası: {e}")
    
    # Save raw
    csv_filename = "superlig_27_hafta_raw.csv"
    cols = [c for c in df.columns if c != 'HaftaNum']
    df[cols].to_csv(csv_filename, index=False, encoding='utf-8-sig')
    print(f"✅ Süper Lig 27 haftalık ham veri '{csv_filename}' dosyasına kaydedildi.")

if __name__ == "__main__":
    main()
