"""
Debug: FBref'ten gelen HTML'i kaydet
"""
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

URL = "https://fbref.com/en/comps/26/schedule/Super-Lig-Scores-and-Fixtures"

options = Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option("useAutomationExtension", False)
options.add_argument(
    "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

driver = webdriver.Chrome(options=options)
driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

print("🌐 Sayfa açılıyor...")
driver.get(URL)

print("⏳ 8 saniye bekleniyor...")
time.sleep(8)

html = driver.page_source
driver.quit()

# HTML'i kaydet
with open("debug_fbref.html", "w", encoding="utf-8") as f:
    f.write(html)

print(f"✅ HTML kaydedildi: debug_fbref.html ({len(html)} karakter)")
print(f"📄 İlk 500 karakter:")
print(html[:500])