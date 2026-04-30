import requests
import pandas as pd
import json
import time

# Yeni API Anahtarı
API_KEY = "fLV29jzQTgTle5uzwqfICTpIrL4xbweQrcMahgK3AwGjzLHinumCdPJjjQRa"
BASE_URL = "https://api.sportmonks.com/v3"

# Sportmonks'taki 9 lig - doğru ID'ler
LEAGUES = [
    {"id": 8,    "name": "Premier League",  "filename": "premier_league_veriler.csv"},
    {"id": 564,  "name": "La Liga",         "filename": "la_liga_veriler.csv"},
    {"id": 82,   "name": "Bundesliga",      "filename": "bundesliga_veriler.csv"},
    {"id": 301,  "name": "Ligue 1",         "filename": "ligue1_veriler.csv"},
    {"id": 384,  "name": "Serie A",         "filename": "serie_a_veriler.csv"},
    {"id": 72,   "name": "Eredivisie",      "filename": "eredivisie_veriler.csv"},
    {"id": 462,  "name": "Liga Portugal",   "filename": "liga_portugal_veriler.csv"},
    {"id": 208,  "name": "Pro League",      "filename": "pro_league_veriler.csv"},
    {"id": 600,  "name": "Süper Lig",       "filename": "super_lig_veriler.csv"},
]

def get_current_season_id(league_id):
    url = f"{BASE_URL}/football/leagues/{league_id}?include=currentSeason"
    params = {"api_token": API_KEY}
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    season = data['data'].get('currentseason')
    if season:
        return season['id']
    return None

def fetch_all_fixtures(season_id, league_name):
    """Sezon için tüm OYNANMIŞ maçları çeker."""
    fixtures = []
    page = 1
    has_more = True
    
    url = f"{BASE_URL}/football/fixtures"
    
    print(f"\n📥 {league_name} verileri çekiliyor (Sezon ID: {season_id})...")
    
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
        print(f"  Sayfa {page} çekildi. (Toplam maç: {len(fixtures)})")
        page += 1
        time.sleep(0.5)
        
    return fixtures

def process_data(fixtures):
    """Maç verilerini işler - sadece oynanmış maçları alır."""
    records = []
    skipped = 0
    
    for f in fixtures:
        # Sadece bitmiş maçları al (state_id: 5 = FT, finished)
        state_id = f.get('state_id', 0)
        # state_id 1=NS (Not Started), 5=FT (Finished), 3=LIVE, etc.
        # Oynanmamış maçları atla
        if state_id not in [5, 7, 8, 9, 11]:  # FT, AET, FT_PEN, Abandoned(counted), WO
            # Alternatif kontrol: skor var mı?
            scores = f.get('scores', [])
            has_score = any(s.get('score', {}).get('goals') is not None for s in scores) if scores else False
            if not has_score:
                skipped += 1
                continue
        
        round_info = f.get('round', {})
        round_name = round_info.get('name', 'N/A')
        
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
            if len(participants) >= 2:
                home_team_id = participants[0].get('id')
                away_team_id = participants[1].get('id')
                home_team = participants[0].get('name')
                away_team = participants[1].get('name')
            else:
                continue

        # Skor
        scores = f.get('scores', [])
        ft_home = next((s.get('score', {}).get('goals', 0) for s in scores 
                       if s.get('type_id') == 1525 and s.get('participant_id') == home_team_id), None)
        ft_away = next((s.get('score', {}).get('goals', 0) for s in scores 
                       if s.get('type_id') == 1525 and s.get('participant_id') == away_team_id), None)
        
        if ft_home is None or ft_away is None:
            ft_home = next((s.get('score', {}).get('goals', 0) for s in scores 
                           if s.get('type_id') == 1529 and s.get('participant_id') == home_team_id), None)
            ft_away = next((s.get('score', {}).get('goals', 0) for s in scores 
                           if s.get('type_id') == 1529 and s.get('participant_id') == away_team_id), None)
        
        # Skor yoksa bu maç oynanmamış demektir, atla
        if ft_home is None and ft_away is None:
            skipped += 1
            continue
            
        home_score = ft_home if ft_home is not None else 0
        away_score = ft_away if ft_away is not None else 0

        # İstatistikler
        home_xg, away_xg = 0.0, 0.0
        home_bc, away_bc = 0, 0
        home_kk, away_kk = 0, 0
        home_pen, away_pen = 0, 0
        home_is, away_is = 0, 0
        home_ts, away_ts = 0, 0
        home_sut, away_sut = 0, 0
        home_kor, away_kor = 0, 0
        
        # xG
        xg_stats = f.get('xgfixture', [])
        if isinstance(xg_stats, list):
            for s in xg_stats:
                if s.get('type_id') == 5304:
                    p_id = s.get('participant_id')
                    val = s.get('data', {}).get('value', 0)
                    if p_id == home_team_id: home_xg = float(val)
                    elif p_id == away_team_id: away_xg = float(val)
        
        # Standart istatistikler
        std_stats = f.get('statistics', [])
        if isinstance(std_stats, list):
            for s in std_stats:
                p_id = s.get('participant_id')
                val = s.get('data', {}).get('value', 0)
                t_id = s.get('type_id')
                
                if t_id == 581:    # Big Chances
                    if p_id == home_team_id: home_bc = int(val)
                    elif p_id == away_team_id: away_bc = int(val)
                elif t_id == 5304 and home_xg == 0:  # xG fallback
                    if p_id == home_team_id: home_xg = float(val)
                    elif p_id == away_team_id: away_xg = float(val)
                elif t_id == 83:   # Kırmızı Kart
                    if p_id == home_team_id: home_kk = int(val)
                    elif p_id == away_team_id: away_kk = int(val)
                elif t_id == 47:   # Penaltı
                    if p_id == home_team_id: home_pen = int(val)
                    elif p_id == away_team_id: away_pen = int(val)
                elif t_id == 86:   # İsabetli Şut
                    if p_id == home_team_id: home_is = int(val)
                    elif p_id == away_team_id: away_is = int(val)
                elif t_id == 45:   # Topa Sahip Olma %
                    if p_id == home_team_id: home_ts = int(val)
                    elif p_id == away_team_id: away_ts = int(val)
                elif t_id == 42:   # Toplam Şut
                    if p_id == home_team_id: home_sut = int(val)
                    elif p_id == away_team_id: away_sut = int(val)
                elif t_id == 34:   # Korner
                    if p_id == home_team_id: home_kor = int(val)
                    elif p_id == away_team_id: away_kor = int(val)

        disp_home_xg = home_xg if home_xg > 0 else float(home_bc)
        disp_away_xg = away_xg if away_xg > 0 else float(away_bc)
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
    
    if skipped > 0:
        print(f"  ⏭️ {skipped} oynanmamış maç atlandı.")
            
    return records

def save_league_data(league):
    try:
        print(f"\n{'='*60}")
        print(f"⚽ {league['name']} işleniyor...")
        print(f"{'='*60}")
        
        season_id = get_current_season_id(league['id'])
        if not season_id:
            print(f"❌ {league['name']} için sezon bulunamadı!")
            return False
            
        print(f"  Sezon ID: {season_id}")
        fixtures = fetch_all_fixtures(season_id, league['name'])
        records = process_data(fixtures)
        
        if not records:
            print(f"❌ {league['name']} için maç verisi alınamadı.")
            return False

        df = pd.DataFrame(records)
        
        # Hafta numarasına göre sırala
        try:
            df['HaftaNum'] = df['Hafta'].str.extract(r'(\d+)').astype(float).fillna(0).astype(int)
            df = df[df['HaftaNum'] > 0]
            df = df.sort_values(['HaftaNum', 'Ev Sahibi'])
        except Exception as e:
            print(f"  ⚠️ Sıralama hatası: {e}")
            
        csv_filename = league['filename']
        cols_to_print = [c for c in df.columns if c != 'HaftaNum']
        df[cols_to_print].to_csv(csv_filename, index=False, encoding='utf-8-sig')
        
        max_hafta = df['HaftaNum'].max() if 'HaftaNum' in df.columns else '?'
        total_matches = len(df)
        print(f"✅ {league['name']} - {total_matches} maç, {max_hafta}. haftaya kadar -> '{csv_filename}'")
        return True

    except Exception as e:
        print(f"❌ Hata ({league['name']}): {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🏆 Dünyanın İlk 9 Ligi - Veri Çekme İşlemi")
    print("=" * 60)
    print(f"Toplam Lig: {len(LEAGUES)}")
    print("Sadece oynanmış maçlar çekilecek.\n")
    
    # API key test
    print("🔑 API anahtarı test ediliyor...")
    test_resp = requests.get(f"{BASE_URL}/football/leagues/8", params={"api_token": API_KEY})
    if test_resp.status_code != 200:
        print(f"❌ API anahtarı çalışmıyor! Status: {test_resp.status_code}")
        return
    print("✅ API anahtarı geçerli!\n")
    
    results = {}
    for league in LEAGUES:
        success = save_league_data(league)
        results[league['name']] = success
        time.sleep(1)
    
    # Özet
    print("\n" + "=" * 60)
    print("📊 SONUÇ ÖZETİ")
    print("=" * 60)
    for name, success in results.items():
        status = "✅ Başarılı" if success else "❌ Başarısız"
        print(f"  {name}: {status}")
    
    success_count = sum(1 for v in results.values() if v)
    print(f"\n  Toplam: {success_count}/{len(LEAGUES)} lig başarıyla çekildi.")

if __name__ == "__main__":
    main()
