# Futbol Tahmin API

Elo + xG tabanlı, çok ligli futbol maç tahmin motoru. 8 Avrupa ligi verisini kullanarak iki takım arasındaki maç sonucunu tahmin eder ve REST API üzerinden sonuçları döner.

## Desteklenen Ligler ( `datasets/` Klasöründe )

| Lig | Dosya |
|-----|-------|
| Süper Lig | `superlig_veriler_final.csv` |
| La Liga | `la_liga_veriler_final.csv` |
| Premier League | `premier_league_veriler_final.csv` |
| Bundesliga | `bundesliga_veriler_final.csv` |
| Eredivisie | `eredivisie_veriler_final.csv` |
| Liga Portugal | `liga_portugal_veriler_final.csv` |
| Ligue 1 | `ligue_1_veriler_final.csv` |
| Serie A | `serie_a_veriler_final.csv` |

> Takım piyasa değerleri `datasets/piyasadegeri.csv` dosyasından okunur.

---

## Kurulum

```bash
pip install fastapi uvicorn
```

---

## API'yi Başlatma

```bash
python api.py
```

> API başladığında otomatik olarak `league_params.json` dosyasını veya CSV veri güncellenmelerini kontrol eder. Eğer yeni bir CSV eklendiyse veya parametre dosyası eksikse **Otomatik Optimizasyon** süreci başlar.

**Swagger UI (interaktif test):** http://localhost:8000/docs  
**API Şeması:** http://localhost:8000/openapi.json

---

## Endpoint'ler

### `GET /health`
API durumunu ve yüklenen takım sayısını döner.

```bash
curl http://localhost:8000/health
```

---

### `GET /teams?search=<arama>`
Sistemdeki takım isimlerini listeler. `search` parametresi ile filtrelenebilir.

```bash
curl http://localhost:8000/teams?search=galata
```

> Takım adlarını `/teams` endpoint'inden öğrenin — Türkçe karakterler dahil tam adı kullanmalısınız (örn. `Fenerbahçe`, `Beşiktaş`).

---

### `POST /predict`
İki takım arasındaki maç tahminini hesaplar.

**Örnek istek:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "home": "Galatasaray",
    "away": "Fenerbahçe",
    "home_missing": {"attack": 15.0, "defense": 0, "midfield": 0},
    "away_missing": {"attack": 0, "defense": 12.0, "midfield": 0}
  }'
```

| Alan | Açıklama |
|------|----------|
| `home` / `away` | Takım isimleri (`/teams` endpoint'inden teyit edilmiş tam ad) |
| `*_missing.*` | Eksik oyuncuların piyasa değeri (Milyon €). Eksik yoksa ilgili alan gönderilmeyebilir. |

---

### `POST /optimize`
Tahmin motorunun parametrelerini yeniden optimize eder. Veriler (`datasets/` içindeki CSV'ler) güncellendiğinde manuel olarak çağrılabilir.

**Örnek istek:**
```bash
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "force": true
  }'
```

| Alan | Açıklama |
|------|----------|
| `force` | `true` ise her zaman optimizasyonu yeniden çalıştırır. `false` ise sadece CSV dosyaları `league_params.json`'dan daha yeniyse çalışır. |

---

## CLI Kullanımı (Terminal)

API olmadan doğrudan terminal üzerinden de çalıştırılabilir:

```bash
python run.py Galatasaray Fenerbahçe
```

Çalıştırdıktan sonra eksik oyuncu değerlerini girebilirsiniz.

---

## Proje Yapısı

```
futbol_anz/
├── core/                    # Tahmin motoru (saf hesaplama, bağımlılıksız)
│   ├── models.py            # MatchRecord, EloState veri yapıları
│   ├── math_utils.py        # sigmoid, elo_expected, poisson_pmf
│   ├── rating.py            # RatingSystem (Elo + xG güncelleme)
│   ├── expected_goals.py    # Lambda hesabı
│   ├── simulation.py        # Dixon-Coles + Poisson simülasyon matrisi
│   └── predictor.py         # predict_match() -> JSON üretici
├── data/                    # Veri katmanı
│   ├── loader.py            # CSV okuma fonksiyonları
│   └── registry.py          # Dosya yolu / lig ismi tanımları
├── optimizer/               # Model Optimizasyonu
│   ├── params.py            # Baseline ve candidate parametreler
│   ├── search.py            # Coordinate descent ve micro-tuning
│   ├── evaluator.py         # Brier ve Accuracy hesabı
│   └── auto.py              # Otomatik güncellik kontrolü (stale check)
├── datasets/                # Lig maç verileri ve piyasa değerleri (*.csv)
├── league_params.json       # Optimize edilmiş lig model parametreleri
├── engine.py                # Tüm ligleri yükler ve global_ratings döndürür
├── backtest.py              # Geçmiş haftalardan günümüze doğruluk ölçümü
├── api.py                   # FastAPI REST API servisi
└── run.py                   # Terminal / CLI arayüzü
```

---

## Model Hakkında

- **Elo Rating**: Her takım için güncel güç puanı, piyasa değeriyle başlatılır
- **xG (Expected Goals)**: İsabetli şut, top hakimiyeti, korner ve form üzerinden hesaplanır
- **Dixon-Coles**: 0-0 ve 1-1 düzeltmesi ile daha isabetli olasılık matrisi
- **Eksik Oyuncu Etkisi**: Oyuncunun piyasa değerinin takım toplam değerine oranına göre ağırlıklandırılır
- **Global Backtest**: 8 lig, ~61.9% tahmin doğruluğu
