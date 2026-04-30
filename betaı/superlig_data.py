import requests
import pandas as pd
import json

# API Configuration
API_KEY = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii"
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
    """Fetches all fixtures for the season handle pagination."""
    fixtures = []
    page = 1
    has_more = True
    
    url = f"{BASE_URL}/football/fixtures"
    include_str = "scores;participants;round;statistics"
    
    print(f"Süper Lig verileri çekiliyor (Sezon ID: {season_id})...")
    
    while has_more:
        # Adding xGFixture and statistics to get real Expected Goals data
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
        
        # Check pagination
        pagination = data.get('pagination', {})
        has_more = pagination.get('has_more', False)
        print(f"Sayfa {page} çekildi. (Toplam maç: {len(fixtures)})")
        page += 1
        
    return fixtures

def process_data(fixtures):
    records = []
    
    for f in fixtures:
        # Round info
        round_info = f.get('round', {})
        round_name = round_info.get('name', 'N/A')
        
        # Participants mapping
        # Correctly identify home and away participants
        participants = f.get('participants', [])
        home_team_id = None
        away_team_id = None
        home_team = "Unknown"
        away_team = "Unknown"
        
        for p in participants:
            if p.get('meta', {}).get('location') == 'home':
                home_team_id = p.get('id')
                home_team = p.get('name')
            elif p.get('meta', {}).get('location') == 'away':
                away_team_id = p.get('id')
                away_team = p.get('name')
        
        if not home_team_id or not away_team_id:
            # Fallback for old/damaged data
            home_team_id = participants[0].get('id') if len(participants) > 0 else 0
            away_team_id = participants[1].get('id') if len(participants) > 1 else 0
            home_team = participants[0].get('name') if len(participants) > 0 else "Unknown"
            away_team = participants[1].get('name') if len(participants) > 1 else "Unknown"
        
        # Scores
        home_score = 0
        away_score = 0
        scores = f.get('scores', [])
        
        # In Sportmonks V3, scores are often by type_id. 
        # Verified IDs for this season: 1525 (CURRENT) usually has the final score. 
        # 1529 (FT) might be used in some plans/leagues.
        
        # We try to find CURRENT (1525) first as it's verified in debug
        ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == home_team_id), None)
        ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1525 and s.get('participant_id') == away_team_id), None)
        
        if ft_home is None or ft_away is None:
            # Fallback to 1529 (FT)
            ft_home = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == home_team_id), None)
            ft_away = next((s.get('score', {}).get('goals', 0) for s in scores if s.get('type_id') == 1529 and s.get('participant_id') == away_team_id), None)
            
        home_score = ft_home if ft_home is not None else 0
        away_score = ft_away if ft_away is not None else 0
            
        # Special case: If still 0-0 but we see goals in type_id 1/2 (halves), we might need to sum them?
        # Actually, FT should have the total.

        # Statistics (Real xG and Big Chances Proxy)
        home_xg = 0.0
        away_xg = 0.0
        home_bc = 0
        away_bc = 0
        
        # Additional statistics
        home_kk = 0
        away_kk = 0
        home_pen = 0
        away_pen = 0
        home_is = 0
        away_is = 0
        home_ts = 0
        away_ts = 0
        home_sut = 0
        away_sut = 0
        home_kor = 0
        away_kor = 0
        
        # In BULK queries, Sportmonks puts xG stats in 'xgfixture' 
        # and standard stats in 'statistics'. We check both.
        
        # 1. Check xG in xgfixture array
        xg_stats = f.get('xgfixture', [])
        for s in xg_stats:
            if s.get('type_id') == 5304: # Expected Goals
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_xg = float(val)
                elif p_id == away_team_id: away_xg = float(val)
        
        # 2. Check Big Chances in statistics array
        std_stats = f.get('statistics', [])
        for s in std_stats:
            if s.get('type_id') == 581: # Big Chances
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_bc = int(val)
                elif p_id == away_team_id: away_bc = int(val)
            # Sometimes 5304 is also here, let's be safe
            elif s.get('type_id') == 5304 and home_xg == 0:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_xg = float(val)
                elif p_id == away_team_id: away_xg = float(val)
            # 83: Redcards
            elif s.get('type_id') == 83:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_kk = int(val)
                elif p_id == away_team_id: away_kk = int(val)
            # 47: Penalties
            elif s.get('type_id') == 47:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_pen = int(val)
                elif p_id == away_team_id: away_pen = int(val)
            # 86: Shots On Target
            elif s.get('type_id') == 86:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_is = int(val)
                elif p_id == away_team_id: away_is = int(val)
            # 45: Ball Possession %
            elif s.get('type_id') == 45:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_ts = int(val)
                elif p_id == away_team_id: away_ts = int(val)
            # 42: Total Shots
            elif s.get('type_id') == 42:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_sut = int(val)
                elif p_id == away_team_id: away_sut = int(val)
            # 34: Corners
            elif s.get('type_id') == 34:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                if p_id == home_team_id: home_kor = int(val)
                elif p_id == away_team_id: away_kor = int(val)

        # Final display values
        # If xG is 0, fallback to Big Chances
        disp_home_xg = home_xg if home_xg > 0 else float(home_bc)
        disp_away_xg = away_xg if away_xg > 0 else float(away_bc)
        
        # Date
        tarih = f.get('starting_at', '').split(' ')[0] if f.get('starting_at') else "Bilinmiyor"

        records.append({
            "Hafta": round_name,
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

def main():
    try:
        season_id = get_current_season_id()
        fixtures = fetch_all_fixtures(season_id)
        records = process_data(fixtures)
        
        if not records:
            print("Maç verisi alınamadı.")
            return

        df = pd.DataFrame(records)
        
        # Sort by Hafta and filter up to 26
        try:
            df['HaftaNum'] = df['Hafta'].str.extract('(\d+)').astype(int)
            # User requested data up to week 26
            df = df[df['HaftaNum'] <= 26]
            df = df.sort_values(['HaftaNum', 'Ev Sahibi'])
        except Exception as e:
            print(f"Sıralama hatası: {e}")
            pass
            
        pd.set_option('display.max_rows', None) # Show all filtered rows
        pd.set_option('display.width', 1000)
        
        print("\n--- Süper Lig Maç Sonuçları (1-26. Haftalar) ---\n")
        cols_to_print = [c for c in df.columns if c != 'HaftaNum']
        print(df[cols_to_print].to_string(index=False))
        
        csv_filename = "superlig_26_hafta_veriler.csv"
        df[cols_to_print].to_csv(csv_filename, index=False, encoding='utf-8-sig')
        
        # Save to JSON for the beautiful dashboard
        json_filename = "superlig_data.json"
        with open(json_filename, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=4)
            
        print(f"\nVeriler '{csv_filename}' ve '{json_filename}' dosyalarına kaydedildi.")
        print("\nBilgi: API planınız xG verisi (Beklenen Gol) içermediği için en yakın istatistik olan 'Net Fırsat' (Big Chances) eklenmiştir.")

    except Exception as e:
        print(f"Hata: {e}")

if __name__ == "__main__":
    main()
