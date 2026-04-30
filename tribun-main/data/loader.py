"""
data/loader.py
CSV veri okuma fonksiyonlari.
"""
import csv
from datetime import date
from typing import Dict, List

from core.models import MatchRecord


def read_market_values(path: str) -> Dict[str, float]:
    values: Dict[str, float] = {}
    with open(path, "r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            values[row["Takim"].strip()] = float(row["PiyasaDegeri"])
    return values


def read_matches(path: str) -> List[MatchRecord]:
    history: List[MatchRecord] = []
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        i = 1
        for row in reader:
            skor = row["Skor"].split("-")
            home_goals = int(skor[0].strip()) if skor[0].strip() else 0
            away_goals = int(skor[1].strip()) if skor[1].strip() else 0

            history.append(
                MatchRecord(
                    id=i,
                    hafta=int(row["Hafta"]),
                    tarih=date.fromisoformat(row["Tarih"]),
                    home_name=row["Ev Sahibi"].strip(),
                    away_name=row["Deplasman"].strip(),
                    home_goals=home_goals,
                    away_goals=away_goals,
                    home_xg=float(row.get("Ev xG", 0)),
                    away_xg=float(row.get("Dep xG", 0)),
                    home_kk=int(row.get("Ev KK", 0)),
                    away_kk=int(row.get("Dep KK", 0)),
                    home_pen=int(row.get("Ev Pen", 0)),
                    away_pen=int(row.get("Dep Pen", 0)),
                    home_sot=int(row.get("Ev IS", 0) or row.get("Ev \u0130\u015e", 0)),
                    away_sot=int(row.get("Dep IS", 0) or row.get("Dep \u0130\u015e", 0)),
                    home_poss=int(row.get("Ev TS", 50)),
                    away_poss=int(row.get("Dep TS", 50)),
                    home_shots=int(row.get("Ev Sut", 0) or row.get("Ev \u015eut", 0)),
                    away_shots=int(row.get("Dep Sut", 0) or row.get("Dep \u015eut", 0)),
                    home_corners=int(row.get("Ev Kor", 0)),
                    away_corners=int(row.get("Dep Kor", 0)),
                    home_missing_att=float(row.get("Ev_Eksik_Hucum", 0)),
                    home_missing_def=float(row.get("Ev_Eksik_Savunma", 0)),
                    home_missing_mid=float(row.get("Ev_Eksik_Orta", 0)),
                    away_missing_att=float(row.get("Dep_Eksik_Hucum", 0)),
                    away_missing_def=float(row.get("Dep_Eksik_Savunma", 0)),
                    away_missing_mid=float(row.get("Dep_Eksik_Orta", 0)),
                )
            )
            i += 1
    return history
