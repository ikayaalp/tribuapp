"""
optimizer/auto.py
Otomatik optimizer: league_params.json yoksa veya CSV'ler daha yeniyse
optimizasyonu otomatik calistirir.
"""
import json
import os
import time
from typing import Dict, List, Optional

from data.loader import read_market_values, read_matches
from data.registry import DATA_FILES, BASE_DIR, csv_path, MARKET_VALUES_FILE, params_path
from optimizer.evaluator import evaluate_global
from optimizer.search import coordinate_descent
from optimizer.params import BASELINE_PARAMS, LEAGUE_CANDIDATES



def _is_stale() -> bool:
    """
    league_params.json yoksa veya herhangi bir CSV dosyasindan eskiyse True dondurur.
    """
    p = params_path()
    if not os.path.exists(p):
        return True

    params_mtime = os.path.getmtime(p)

    # Market values CSV
    mv = csv_path(MARKET_VALUES_FILE)
    if os.path.exists(mv) and os.path.getmtime(mv) > params_mtime:
        return True

    # Lig CSV'leri
    for filename in DATA_FILES.values():
        fp = csv_path(filename)
        if os.path.exists(fp) and os.path.getmtime(fp) > params_mtime:
            return True

    return False


def run_optimization(verbose: bool = True) -> dict:
    """
    Tum ligler icin lig bazli koordinat inisi optimizasyonu yapar.
    Sonuclari league_params.json'a kaydeder ve dict dondurur.
    """
    t0 = time.time()

    if verbose:
        print("[Optimizer] Veri yukleniyor...")

    market_values = read_market_values(csv_path(MARKET_VALUES_FILE))
    leagues: Dict[str, List] = {}
    for name, filename in DATA_FILES.items():
        leagues[name] = read_matches(csv_path(filename))
        if verbose:
            print(f"  {name}: {len(leagues[name])} mac")

    results = {}
    total_correct = 0
    total_matches = 0

    for name, matches in leagues.items():
        if not matches:
            continue
        if verbose:
            print(f"\n[Optimizer] {name} optimizasyonu basliyor (4 tur)...")

        best = coordinate_descent(
            [matches], market_values,
            BASELINE_PARAMS.copy(),
            LEAGUE_CANDIDATES,
            num_rounds=4,
            verbose=verbose,
        )

        acc, brier, correct, total = evaluate_global([matches], market_values, best)

        results[name] = {
            "params": best,
            "accuracy": round(acc * 100, 2),
            "brier": round(brier, 4),
            "correct": correct,
            "total": total,
        }
        total_correct += correct
        total_matches += total

        if verbose:
            print(f"[Optimizer] {name} bitti: %{acc*100:.1f} ({correct}/{total})")

    global_acc = round(total_correct / total_matches * 100, 2) if total_matches > 0 else 0.0
    duration = round(time.time() - t0, 1)

    output = {
        "leagues": results,
        "global_accuracy": global_acc,
        "total_correct": total_correct,
        "total_matches": total_matches,
        "duration_seconds": duration,
    }

    with open(params_path(), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    if verbose:
        print(f"\n[Optimizer] Tamamlandi! Global: %{global_acc:.1f} | Sure: {duration}s")
        print(f"[Optimizer] Parametreler kaydedildi: {params_path()}")

    return output


def ensure_params_fresh(verbose: bool = True) -> Optional[dict]:
    """
    API baslarken cagrilir.
    Parametreler guncelse None dondurur (yeniden optimize etmez).
    Eski/eksikse optimizasyonu calistirir ve sonucu dondurur.
    """
    if _is_stale():
        reason = "league_params.json bulunamadi" if not os.path.exists(params_path()) else "CSV verileri guncellendi"
        if verbose:
            print(f"[Optimizer] {reason}, optimizasyon baslatiliyor...")
        return run_optimization(verbose=verbose)
    else:
        if verbose:
            print("[Optimizer] Parametreler guncel, optimizasyon atlanıyor.")
        return None
