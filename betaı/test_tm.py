import requests

def test_club_scraping():
    url = "https://www.transfermarkt.com.tr/galatasaray-sk/kader/verein/141/saison_id/2024"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
    resp = requests.get(url, headers=headers)
    with open("tm_test.html", "w", encoding="utf-8") as f:
        f.write(resp.text)

if __name__ == "__main__":
    test_club_scraping()
