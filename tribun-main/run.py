"""
run.py
CLI giris noktasi.
Kullanim: python run.py <ev_takimi> <deplasman_takimi>
Ornek:    python run.py Galatasaray Fenerbahce
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from engine import build_global_ratings
from core.predictor import print_prediction
from core.math_utils import weighted_average


def main():
    print("Veriler yukleniyor...")
    global_ratings, market_values, median_val = build_global_ratings()
    teams = sorted(global_ratings.ratings.keys())

    print(f"\n{'GLOBAL ELO SIRALAMASI':=^60}")
    for i, team in enumerate(
        sorted(global_ratings.ratings.keys(), key=lambda t: global_ratings.ratings[t].elo, reverse=True),
        1,
    ):
        state = global_ratings.ratings[team]
        form_indicator = " ="
        if state.recent_results:
            avg_res = weighted_average(state.recent_results)
            form_indicator = " +" if avg_res > 0.6 else (" -" if avg_res < 0.4 else " =")
        print(
            f"{i:3d}. {team:<22} | Elo: {state.elo:7.1f} | "
            f"Hucum: {state.xg_attack:.3f} | Savunma: {state.xg_defense:.3f} | "
            f"{state.wins}G-{state.draws}B-{state.losses}M{form_indicator}"
        )

    if len(sys.argv) == 3:
        home_side = sys.argv[1]
        away_side = sys.argv[2]

        print(f"\n[{home_side}] - Eksik Oyuncular (Milyon Euro):")
        hma = float(input("  Hucum (Varsayilan 0): ") or "0")
        hmd = float(input("  Savunma (Varsayilan 0): ") or "0")
        hmm = float(input("  Orta Saha (Varsayilan 0): ") or "0")

        print(f"\n[{away_side}] - Eksik Oyuncular (Milyon Euro):")
        ama = float(input("  Hucum (Varsayilan 0): ") or "0")
        amd = float(input("  Savunma (Varsayilan 0): ") or "0")
        amm = float(input("  Orta Saha (Varsayilan 0): ") or "0")

        print_prediction(home_side, away_side, global_ratings, hma, hmd, hmm, ama, amd, amm)
    else:
        print("\nTahmin yapmak icin iki takim adi verin:")
        print("  python run.py Galatasaray Fenerbahce\n")


if __name__ == "__main__":
    main()
