import requests
from bs4 import BeautifulSoup

url = "https://www.transfermarkt.com.tr/super-lig/marktwerte/wettbewerb/TR1/pos//detail_pos/0/altersklasse/alle/plus/1/page/1"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, "html.parser")
table = soup.find("table", class_="items")
rows = table.find_all("tr", class_=["odd", "even"])

row = rows[0]
cols = row.find_all("td")
print(f"Number of cols: {len(cols)}")
for i, col in enumerate(cols):
    text = col.text.strip()[:60]
    imgs = [(im.get("alt",""), im.get("title","")) for im in col.find_all("img")]
    links = [(a.get("title",""), a.get("href","")[:50]) for a in col.find_all("a")]
    print(f"Col {i}: text={text!r}")
    if imgs:
        print(f"  imgs: {imgs}")
    if links:
        print(f"  links: {links}")
