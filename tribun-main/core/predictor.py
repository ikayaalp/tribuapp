"""
core/predictor.py
predict_match(): JSON sozlugu dondurur.
print_prediction(): CLI icin terminale yazdirir.
"""
from datetime import date
from typing import Optional

from core.models import MatchRecord, EloState
from core.math_utils import weighted_average
from core.expected_goals import ExpectedGoalsModel
from core.simulation import SimulationEngine
from core.rating import RatingSystem


def predict_match(
    home: str,
    away: str,
    ratings: RatingSystem,
    h_miss_att: float = 0.0,
    h_miss_def: float = 0.0,
    h_miss_mid: float = 0.0,
    a_miss_att: float = 0.0,
    a_miss_def: float = 0.0,
    a_miss_mid: float = 0.0,
) -> Optional[dict]:
    """Tahmin yapar ve sonuclari dict olarak dondurur."""
    missing = [t for t in [home, away] if t not in ratings.ratings]
    if missing:
        return {"error": f"Takim bulunamadi: {', '.join(missing)}"}

    home_state: EloState = ratings.ratings[home]
    away_state: EloState = ratings.ratings[away]

    dummy_m = MatchRecord(
        id=0, hafta=0, tarih=date.today(),
        home_name=home, away_name=away,
        home_goals=0, away_goals=0, home_xg=0, away_xg=0,
        home_kk=0, away_kk=0, home_pen=0, away_pen=0,
        home_sot=0, away_sot=0, home_poss=50, away_poss=50,
        home_shots=0, away_shots=0, home_corners=0, away_corners=0,
        home_missing_att=h_miss_att, home_missing_def=h_miss_def, home_missing_mid=h_miss_mid,
        away_missing_att=a_miss_att, away_missing_def=a_miss_def, away_missing_mid=a_miss_mid,
    )

    xg_model = ExpectedGoalsModel()
    lam_h, lam_a = xg_model.compute(home_state, away_state, date.today(), dummy_m)

    sim = SimulationEngine()
    result = sim.simulate(lam_h, lam_a)

    probs = [
        (result["p_home"], f"{home} Kazanir"),
        (result["p_draw"], "Beraberlik"),
        (result["p_away"], f"{away} Kazanir"),
    ]
    probs.sort(reverse=True)
    confidence = probs[0][0] - probs[1][0]
    conf_label = "YUKSEK" if confidence > 0.18 else ("ORTA" if confidence > 0.10 else "DUSUK")

    matrix = result["matrix"]
    max_g = len(matrix)
    over_under = {}
    for line in [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]:
        over = sum(
            matrix[h][a]
            for h in range(max_g)
            for a in range(max_g)
            if h + a > line
        )
        over_under[str(line)] = {"over": round(over * 100, 1), "under": round((1.0 - over) * 100, 1)}

    h_form = sum(home_state.recent_xg_diffs) / len(home_state.recent_xg_diffs) if home_state.recent_xg_diffs else 0.0
    a_form = sum(away_state.recent_xg_diffs) / len(away_state.recent_xg_diffs) if away_state.recent_xg_diffs else 0.0
    h_res  = weighted_average(home_state.recent_results) if home_state.recent_results else 0.5
    a_res  = weighted_average(away_state.recent_results) if away_state.recent_results else 0.5

    h_poss = sum(home_state.recent_possession) / len(home_state.recent_possession) if home_state.recent_possession else 50.0
    a_poss = sum(away_state.recent_possession) / len(away_state.recent_possession) if away_state.recent_possession else 50.0
    h_acc  = sum(home_state.recent_shot_accuracy) / len(home_state.recent_shot_accuracy) * 100 if home_state.recent_shot_accuracy else 35.0
    a_acc  = sum(away_state.recent_shot_accuracy) / len(away_state.recent_shot_accuracy) * 100 if away_state.recent_shot_accuracy else 35.0
    h_cor  = sum(home_state.recent_corners) / len(home_state.recent_corners) if home_state.recent_corners else 0.0
    a_cor  = sum(away_state.recent_corners) / len(away_state.recent_corners) if away_state.recent_corners else 0.0

    scores = [
        {"home_goals": h, "away_goals": a, "probability": round(matrix[h][a] * 100, 1)}
        for h in range(6) for a in range(6)
    ]
    scores.sort(key=lambda x: x["probability"], reverse=True)

    return {
        "home": home,
        "away": away,
        "elo": {
            "home": round(home_state.elo, 1),
            "away": round(away_state.elo, 1),
            "diff": round(home_state.elo - away_state.elo, 1),
        },
        "probabilities": {
            "home_win": round(result["p_home"] * 100, 1),
            "draw":     round(result["p_draw"] * 100, 1),
            "away_win": round(result["p_away"] * 100, 1),
        },
        "prediction": {
            "result":         probs[0][1],
            "confidence":     conf_label,
            "confidence_pct": round(probs[0][0] * 100, 1),
        },
        "expected_goals": {
            "home":        round(result["exp_h"], 2),
            "away":        round(result["exp_a"], 2),
            "lambda_home": round(lam_h, 3),
            "lambda_away": round(lam_a, 3),
        },
        "over_under": over_under,
        "btts": round(result["btts"] * 100, 1),
        "form": {
            "home": {"xg_diff": round(h_form, 2), "last_result_score": round(h_res, 2)},
            "away": {"xg_diff": round(a_form, 2), "last_result_score": round(a_res, 2)},
        },
        "stats": {
            "home": {"possession": round(h_poss, 1), "shot_accuracy": round(h_acc, 1), "corners": round(h_cor, 1)},
            "away": {"possession": round(a_poss, 1), "shot_accuracy": round(a_acc, 1), "corners": round(a_cor, 1)},
        },
        "top_scores": scores[:5],
    }


def print_prediction(
    home: str, away: str, ratings: RatingSystem,
    h_miss_att=0.0, h_miss_def=0.0, h_miss_mid=0.0,
    a_miss_att=0.0, a_miss_def=0.0, a_miss_mid=0.0,
) -> None:
    """CLI icin predict_match() sonucunu terminale yazdirir."""
    data = predict_match(home, away, ratings, h_miss_att, h_miss_def, h_miss_mid,
                         a_miss_att, a_miss_def, a_miss_mid)
    if not data or "error" in data:
        print(data.get("error", "Bilinmeyen hata"))
        return

    print("\n===================================================")
    print(f"  TAHMIN: {data['home']} (E) vs {data['away']} (D)")
    print("===================================================")
    print(f"\n  Elo: {data['elo']['home']:.0f} vs {data['elo']['away']:.0f} (fark: {data['elo']['diff']:+.0f})")
    print(f"\n  Kazanma Olasiliklari:")
    print(f"    {data['home']}: {data['probabilities']['home_win']}%")
    print(f"    Beraberlik: {data['probabilities']['draw']}%")
    print(f"    {data['away']}: {data['probabilities']['away_win']}%")
    p = data["prediction"]
    print(f"\n  >>> TAHMIN: {p['result']} ({p['confidence_pct']}%) - Guven: {p['confidence']}")
    eg = data["expected_goals"]
    print(f"\n  Gol Beklentisi:")
    print(f"    {data['home']}: {eg['home']:.2f}  (lam={eg['lambda_home']:.3f})")
    print(f"    {data['away']}: {eg['away']:.2f}  (lam={eg['lambda_away']:.3f})")
    print(f"\n  Alt/Ust Gol Tahminleri:")
    print(f"    {'Cizgi':<10} {'Ust':>8} {'Alt':>8}")
    print(f"    {'-'*10} {'-'*8} {'-'*8}")
    for line, vals in data["over_under"].items():
        marker = " <" if vals["over"] > 55 or vals["under"] > 55 else ""
        print(f"    {line:<10} {vals['over']:7.1f}% {vals['under']:7.1f}%{marker}")
    print(f"\n  KG Var (BTTS): {data['btts']}%")
    fh, fa = data["form"]["home"], data["form"]["away"]
    print(f"\n  Form:")
    print(f"    {data['home']}: xG fark {fh['xg_diff']:+.2f} | Son mac puani {fh['last_result_score']:.2f}")
    print(f"    {data['away']}: xG fark {fa['xg_diff']:+.2f} | Son mac puani {fa['last_result_score']:.2f}")
    sh, sa2 = data["stats"]["home"], data["stats"]["away"]
    print(f"\n  Istatistikler:")
    print(f"    {'':15} {'Top%':>6} {'Sut Isb%':>9} {'Korner':>7}")
    print(f"    {data['home']:15} {sh['possession']:5.1f}% {sh['shot_accuracy']:8.1f}% {sh['corners']:6.1f}")
    print(f"    {data['away']:15} {sa2['possession']:5.1f}% {sa2['shot_accuracy']:8.1f}% {sa2['corners']:6.1f}")
    print(f"\n  En Olasilik 5 Skor:")
    for s in data["top_scores"]:
        print(f"    {s['home_goals']} - {s['away_goals']} : {s['probability']:.1f}%")
    print("---------------------------------------------------\n")
