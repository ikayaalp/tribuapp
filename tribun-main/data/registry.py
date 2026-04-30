"""
data/registry.py
Lig isimleri ve CSV dosya yollarinin merkezi tanimi.
"""
import os

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")

DATA_FILES: dict[str, str] = {
    "Super Lig":      "superlig_veriler_final.csv",
    "La Liga":        "la_liga_veriler_final.csv",
    "Premier League": "premier_league_veriler_final.csv",
    "Bundesliga":     "bundesliga_veriler_final.csv",
    "Eredivisie":     "eredivisie_veriler_final.csv",
    "Liga Portugal":  "liga_portugal_veriler_final.csv",
    "Ligue 1":        "ligue_1_veriler_final.csv",
    "Serie A":        "serie_a_veriler_final.csv",
}

MARKET_VALUES_FILE = "piyasadegeri.csv"
LEAGUE_PARAMS_FILE = "league_params.json"


def csv_path(filename: str) -> str:
    """Lig ve piyasa CSV dosyalari icin tam yol dondurur (datasets/ klasoru)."""
    return os.path.join(DATASETS_DIR, filename)


def params_path() -> str:
    """league_params.json icin tam yol dondurur (proje koku)."""
    return os.path.join(BASE_DIR, LEAGUE_PARAMS_FILE)
