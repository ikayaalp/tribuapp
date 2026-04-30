"""
backtest.py
run_backtest(): Belirtilen haftadan itibaren gecmis mac tahmin dogrulugunu olcer.
"""
import math
from typing import Dict, List, Optional

from core.models import MatchRecord
from core.rating import RatingSystem
from core.expected_goals import ExpectedGoalsModel
from core.simulation import SimulationEngine
from data.loader import read_market_values


def run_backtest(
    matches: List[MatchRecord],
    market_values: Dict[str, float],
    median_val: float,
    league_name: str = "Lig",
    test_start_week: int = 20,
    params: Optional[dict] = None,
) -> dict:
    """
    Verilen mac listesi uzerinde backtesti calistirir.
    test_start_week oncesindeki maclar sadece model egitimi icin kullanilir.
    """
    rs = RatingSystem()
    if params:
        rs.home_adv      = params.get("home_adv",      rs.home_adv)
        rs.k_base        = params.get("k_base",         rs.k_base)
        rs.xg_blend      = params.get("xg_blend",       rs.xg_blend)
        rs.alpha         = params.get("alpha",           rs.alpha)
        rs.sot_weight    = params.get("sot_weight",      rs.sot_weight)
        rs.acc_weight    = params.get("acc_weight",      rs.acc_weight)
        rs.poss_weight   = params.get("poss_weight",     rs.poss_weight)
        rs.corner_weight = params.get("corner_weight",   rs.corner_weight)

    for team, val in market_values.items():
        rs.init_team(team, val, median_val)

    xg_model = ExpectedGoalsModel()
    if params:
        xg_model.mu_home         = params.get("mu_home",      xg_model.mu_home)
        xg_model.mu_away         = params.get("mu_away",      xg_model.mu_away)
        xg_model.form_weight     = params.get("form_weight",  xg_model.form_weight)
        xg_model.fatigue_discount= params.get("fatigue",      xg_model.fatigue_discount)
        xg_model.poss_lam        = params.get("poss_lam",     xg_model.poss_lam)
        xg_model.cor_lam         = params.get("cor_lam",      xg_model.cor_lam)
        xg_model.acc_lam         = params.get("acc_lam",      xg_model.acc_lam)
        xg_model.miss_att_coef   = params.get("miss_att",     xg_model.miss_att_coef)
        xg_model.miss_def_coef   = params.get("miss_def",     xg_model.miss_def_coef)
        xg_model.miss_mid_coef   = params.get("miss_mid",     xg_model.miss_mid_coef)

    sim = SimulationEngine()
    if params:
        sim.dc_rho      = params.get("dc_rho",       sim.dc_rho)
        sim.temp        = params.get("temp",          sim.temp)
        sim.draw_boost  = params.get("draw_boost",    sim.draw_boost)

    correct = total = 0
    brier = log_loss = 0.0
    thresholds = [0.10, 0.15, 0.18, 0.20, 0.25]
    hc_data = {t: [0, 0] for t in thresholds}

    print(f"\n--- {league_name}: {test_start_week}. HAFTADAN BACKTEST ---")
    for m in matches:
        if m.hafta >= test_start_week:
            if m.home_name in rs.ratings and m.away_name in rs.ratings:
                h_st = rs.ratings[m.home_name]
                a_st = rs.ratings[m.away_name]
                lam_h, lam_a = xg_model.compute(h_st, a_st, m.tarih, m)
                res = sim.simulate(lam_h, lam_a)

                pr = sorted(
                    [(res["p_home"], "H"), (res["p_draw"], "D"), (res["p_away"], "A")],
                    reverse=True,
                )
                pred = pr[0][1]
                conf = pr[0][0] - pr[1][0]
                actual = "H" if m.home_goals > m.away_goals else ("A" if m.away_goals > m.home_goals else "D")

                is_correct = pred == actual
                if is_correct: correct += 1
                total += 1

                for t in thresholds:
                    if conf > t:
                        hc_data[t][1] += 1
                        if is_correct: hc_data[t][0] += 1

                ap = {"H": 0.0, "D": 0.0, "A": 0.0}
                ap[actual] = 1.0
                brier += (res["p_home"] - ap["H"]) ** 2 + (res["p_draw"] - ap["D"]) ** 2 + (res["p_away"] - ap["A"]) ** 2

                eps = 1e-10
                if actual == "H":   log_loss -= math.log(max(res["p_home"], eps))
                elif actual == "D": log_loss -= math.log(max(res["p_draw"], eps))
                else:               log_loss -= math.log(max(res["p_away"], eps))

        rs.update(m)

    if total > 0:
        print(f"  Test: {total} mac | Dogru: {correct} (%{correct/total*100:.1f})")
        print(f"  Brier: {brier/total:.3f} | Log Loss: {log_loss/total:.3f}")

    return {
        "league": league_name,
        "correct": correct,
        "total": total,
        "accuracy": round(correct / total * 100, 1) if total > 0 else 0.0,
        "brier": round(brier / total, 3) if total > 0 else 0.0,
        "log_loss": round(log_loss / total, 3) if total > 0 else 0.0,
        "hc_data": hc_data,
    }
