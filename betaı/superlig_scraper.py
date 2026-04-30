import requests
from bs4 import BeautifulSoup
import json
import time

def tum_super_lig_verilerini_cek():
    base_url = "https://www.transfermarkt.com.tr/super-lig/marktwerte/wettbewerb/TR1/pos//detail_pos/0/altersklasse/alle/plus/1/page/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    tum_oyuncular = []
    
    for page in range(1, 30):
        print(f"Sayfa {page} çekiliyor...")
        response = requests.get(f"{base_url}{page}", headers=headers)
        if response.status_code != 200:
            print(f"Sayfa {page} alınamadı: {response.status_code}")
            break
            
        soup = BeautifulSoup(response.content, "html.parser")
        table = soup.find("table", class_="items")
        if not table:
            print(f"Sayfa {page} tablosu bulunamadı, durduruluyor.")
            break
        rows = table.find_all("tr", class_=["odd", "even"])
        if not rows:
            print(f"Sayfa {page}'de satır yok, durduruluyor.")
            break
        
        for row in rows:
            cols = row.find_all("td")
            try:
                # Col 1: Player name (hauptlink nested in td)
                name_cell = cols[1].find("td", class_="hauptlink")
                if name_cell:
                    name = name_cell.text.strip()
                else:
                    name = cols[1].find("a").text.strip()
                
                # Col 4: Position
                position = cols[4].text.strip()
                
                # Col 7: Club (img alt attribute)
                club_img = cols[7].find("img")
                club = club_img["alt"] if club_img else "Bilinmiyor"
                
                # Col 6: Age
                age = cols[6].text.strip()
                
                # Col 10: Current Market Value
                market_value = cols[10].text.strip()
                
                oyuncu = {
                    "ad": name,
                    "mevki": position,
                    "takim": club,
                    "yas": age,
                    "piyasa_degeri": market_value
                }
                tum_oyuncular.append(oyuncu)
            except Exception as e:
                continue
        
        time.sleep(1)

    output_file = "super_lig_2026.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(tum_oyuncular, f, ensure_ascii=False, indent=4)
    
    print(f"\nİşlem tamam! Toplam {len(tum_oyuncular)} oyuncu '{output_file}' dosyasına kaydedildi.")
    
    # Show unique teams
    teams = sorted(set(o["takim"] for o in tum_oyuncular))
    print(f"Bulunan takımlar ({len(teams)}):")
    for t in teams:
        print(f"  - {t}")

if __name__ == "__main__":
    tum_super_lig_verilerini_cek()