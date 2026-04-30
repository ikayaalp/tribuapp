"""
optimizer/search.py
Koordinat inisi arama algoritmasi (coordinate descent + micro-tuning).
"""
from typing import Dict, List

from core.models import MatchRecord
from optimizer.evaluator import evaluate_global


def coordinate_descent(
    leagues_data: List[List[MatchRecord]],
    market_values: Dict[str, float],
    initial_params: dict,
    candidates: dict,
    num_rounds: int = 4,
    verbose: bool = True,
) -> dict:
    """
    Her parametreyi sirayla optimize eder.
    Her turda iyilesme olmazsa erken durur.
    """
    best = initial_params.copy()
    acc, brier, c, t = evaluate_global(leagues_data, market_values, best)
    best_acc, best_brier = acc, brier

    if verbose:
        print(f"Baslangic: {c}/{t} = %{acc*100:.1f} (Brier: {brier:.4f})")

    for round_num in range(1, num_rounds + 1):
        if verbose:
            print(f"\n--- Tur {round_num}/{num_rounds} ---")
        improved = False

        for param_name, c_list in candidates.items():
            best_val = best[param_name]
            best_score = (best_acc, -best_brier)

            # Aday degerler
            for val in c_list:
                trial = best.copy()
                trial[param_name] = val
                acc, brier, c, t = evaluate_global(leagues_data, market_values, trial)
                if (acc, -brier) > best_score:
                    best_score = (acc, -brier)
                    best_val = val

            if best_val != best[param_name]:
                old_val = best[param_name]
                best[param_name] = best_val
                acc, brier, c, t = evaluate_global(leagues_data, market_values, best)
                best_acc, best_brier = acc, brier
                if verbose:
                    print(f"  {param_name:15s}: {old_val} -> {best_val}  | {c}/{t} = %{acc*100:.1f} (Brier: {brier:.4f})")
                improved = True
            else:
                # Micro-tuning
                current = best[param_name]
                if isinstance(current, (int, float)):
                    delta = abs(current * 0.03) if current != 0 else 0.001
                    micro = sorted(set(round(current + delta * i, 6) for i in range(-3, 4)))
                    for val in micro:
                        trial = best.copy()
                        trial[param_name] = val
                        acc, brier, c, t = evaluate_global(leagues_data, market_values, trial)
                        if (acc, -brier) > best_score:
                            best_score = (acc, -brier)
                            best_val = val
                    if best_val != best[param_name]:
                        best[param_name] = best_val
                        acc, brier, c, t = evaluate_global(leagues_data, market_values, best)
                        best_acc, best_brier = acc, brier
                        if verbose:
                            print(f"  {param_name:15s}: {current} -> {best_val}  | {c}/{t} = %{acc*100:.1f} [fine]")
                        improved = True

        if not improved:
            if verbose:
                print("  Artik iyilesme yok, duruyor.")
            break

    return best
