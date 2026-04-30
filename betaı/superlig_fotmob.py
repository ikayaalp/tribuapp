"""
Süper Lig 2025-2026 — Haftalık Skor + xG (1-26. Hafta)
Kaynak: Fotmob

Kurulum:
    pip install requests pandas

Çalıştırma:
    python superlig_fotmob.py

Çıktı:
    superlig_2025_2026.csv
"""

import requests
import pandas as pd
import time
import re

LEAGUE_ID  = 71
MAX_HAFTA  = 26

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://www.fotmob.com/",
})


def get_all_matches() -> list:
    url = f"https://www.fotmob.com/api/leagues?id={LEAGUE_ID}"
    resp = session.get(url, timeout=15)
    resp.raise_for_status()
    return resp.json()["fixtures"]["allMatches"]


def get_xg(match_id: str) -> tuple:
    """Maç detay sayfasından xG çeker."""
    url = f"https://www.fotmob.com/api/matchDetails?matchId={match_id}"
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code != 200:
            return None, None
        data = resp.json()

        # Path 1: content -> stats -> stats listesi
        stats_groups = (
            data.get("content", {})
                .get("stats", {})
                .get("Periods", {})
                .get("All", {})
                .get("stats", [])
        )
        for group in stats_groups:
            for stat in group.get("stats", []):
                if "xg" in stat.get("title", "").lower() or "expected" in stat.get("title", "").lower():
                    vals = stat.get("stats", [])
                    if len(vals) >= 2:
                        try:
                            return float(vals[0]), float(vals[1])
                        except (ValueError, TypeError):
                            pass

        # Path 2: header -> teams xg alanı
        teams = data.get("header", {}).get("teams", [])
        if len(teams) == 2:
            xg_h = teams[0].get("xg")
            xg_a = teams[1].get("xg")
            if xg_h is not None and xg_a is not None:
                return float(xg_h), float(xg_a)

    except Exception:
        pass
    return None, None


def parse_score(score_str: str) -> tuple:
    """'0 - 3' → (0, 3)"""
    m = re.match(r"(\d+)\s*-\s*(\d+)", score_str or "")
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None


def main():
    print("📥 Fotmob'dan maç listesi çekiliyor...")
    all_matches = get_all_matches()

    # Sadece 1-26. hafta, tamamlanmış maçlar
    hedef = [
        m for m in all_matches
        if m.get("status", {}).get("finished") is True
        and int(m.get("round", 99)) <= MAX_HAFTA
    ]

    print(f"✅ 1-{MAX_HAFTA}. hafta arası {len(hedef)} tamamlanmış maç bulundu.\n")

    rows = []
    for i, m in enumerate(hedef, 1):
        match_id   = m["id"]
        home       = m["home"]["name"]
        away       = m["away"]["name"]
        hafta      = int(m["round"])
        tarih      = m["status"]["utcTime"][:10]
        skor_str   = m["status"].get("scoreStr", "")
        skor_ev, skor_dep = parse_score(skor_str)

        xg_ev, xg_dep = get_xg(match_id)

        rows.append({
            "hafta":     hafta,
            "tarih":     tarih,
            "ev_sahibi": home,
            "deplasman": away,
            "skor_ev":   skor_ev,
            "skor_dep":  skor_dep,
            "xg_ev":     xg_ev,
            "xg_dep":    xg_dep,
        })

        xg_str = f"{xg_ev:.2f} - {xg_dep:.2f}" if xg_ev is not None else "xG yok"
        print(f"  [{i:>3}/{len(hedef)}] Hf{hafta:>2} | {home:<20} {skor_ev}-{skor_dep} {away:<20} | {xg_str}")
        time.sleep(0.4)

    df = pd.DataFrame(rows).sort_values(["hafta", "tarih"]).reset_index(drop=True)

    # Özet tablo
    print(f"\n{'Hf':>3}  {'Ev Sahibi':<22} {'Skor':^5} {'Deplasman':<22} {'xG Ev':>6} {'xG Dep':>7}")
    print("─" * 78)
    for _, r in df.iterrows():
        skor = f"{int(r['skor_ev'])}-{int(r['skor_dep'])}" if pd.notna(r.get("skor_ev")) else "?"
        xgev = f"{r['xg_ev']:.2f}" if pd.notna(r.get("xg_ev")) else "  —  "
        xgdp = f"{r['xg_dep']:.2f}" if pd.notna(r.get("xg_dep")) else "  —  "
        print(f"{int(r['hafta']):>3}  {r['ev_sahibi']:<22} {skor:^5} {r['deplasman']:<22} {xgev:>6} {xgdp:>7}")

    dosya = "superlig_2025_2026.csv"
    df.to_csv(dosya, index=False, encoding="utf-8-sig")
    print(f"\n💾 Kaydedildi: {dosya}")
    print(f"📊 xG verisi olan maç: {df['xg_ev'].notna().sum()} / {len(df)}")


if __name__ == "__main__":
    main()
