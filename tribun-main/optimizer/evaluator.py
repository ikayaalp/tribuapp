"""
optimizer/evaluator.py
Lig ve global dogruluk/brier hesaplama fonksiyonlari.
"""
import math
from typing import Dict, List, Tuple

from core.models import MatchRecord, EloState
from core.math_utils import sigmoid


def evaluate_league(
    matches: List[MatchRecord],
    market_values: Dict[str, float],
    p: dict,
) -> Tuple[int, int, float]:
    """Tek bir lig icin dogru tahmin, toplam mac ve brier skoru dondurur."""
    league_teams = set(m.home_name for m in matches) | set(m.away_name for m in matches)
    league_mvs = [market_values.get(t, 10_000_000.0) for t in league_teams]
    median_val = sorted(league_mvs)[len(league_mvs) // 2] if league_mvs else 10_000_000.0

    ratings: Dict[str, EloState] = {}
    for team in league_teams:
        val = market_values.get(team, 10_000_000.0)
        s = EloState()
        s.market_value = val
        ratio = val / median_val
        s.elo = 1500.0 + math.log10(ratio) * p.get("mv_weight", 100.0) if ratio > 0 else 1500.0
        ratings[team] = s

    league_avg = 1.35
    total_xg = 0.0
    tm_count = 0
    correct = total = 0
    brier = 0.0
    FL = int(p.get("form_len", 5))

    for m in matches:
        if m.home_xg == 0 and m.away_xg == 0 and m.home_goals == 0 and m.away_goals == 0:
            if m.home_sot == 0 and m.away_sot == 0:
                continue

        home = ratings[m.home_name]
        away = ratings[m.away_name]

        # --- Tahmin ---
        if m.hafta >= p.get("test_start", 20):
            hf = sum(home.recent_xg_diffs) / len(home.recent_xg_diffs) if home.recent_xg_diffs else 0.0
            af = sum(away.recent_xg_diffs) / len(away.recent_xg_diffs) if away.recent_xg_diffs else 0.0

            lh = p.get("mu_home", 1.49) * home.xg_attack * away.xg_defense * 1.05 + hf * p.get("form_weight", 0.2)
            la = p.get("mu_away", 1.16) * away.xg_attack * home.xg_defense + af * p.get("form_weight", 0.2)

            if home.recent_possession:
                hp = sum(home.recent_possession) / len(home.recent_possession)
                ap = sum(away.recent_possession) / len(away.recent_possession)
                lh *= 1.0 + (hp - 50) * p.get("poss_lam", 0.001)
                la *= 1.0 + (ap - 50) * p.get("poss_lam", 0.001)

            if home.recent_corners:
                hc = sum(home.recent_corners) / len(home.recent_corners)
                ac = sum(away.recent_corners) / len(away.recent_corners)
                lh += max(0, hc - 4) * p.get("cor_lam", 0.08)
                la += max(0, ac - 4) * p.get("cor_lam", 0.08)

            if home.recent_shot_accuracy:
                ha = sum(home.recent_shot_accuracy) / len(home.recent_shot_accuracy)
                aa = sum(away.recent_shot_accuracy) / len(away.recent_shot_accuracy)
                lh *= 1.0 + (ha - 0.35) * p.get("acc_lam", 0.2)
                la *= 1.0 + (aa - 0.35) * p.get("acc_lam", 0.2)

            if home.last_match_date and (m.tarih - home.last_match_date).days <= 3:
                lh *= p.get("fatigue", 0.88)
            if away.last_match_date and (m.tarih - away.last_match_date).days <= 3:
                la *= p.get("fatigue", 0.88)

            MISS_ATT = p.get("miss_att", 0.0)
            MISS_DEF = p.get("miss_def", 0.0)
            MISS_MID = p.get("miss_mid", 0.0)
            if MISS_ATT > 0 or MISS_DEF > 0 or MISS_MID > 0:
                h_mv = home.market_value / 1e6
                a_mv = away.market_value / 1e6
                h_att = min(1.0, m.home_missing_att / h_mv) if h_mv > 0 else 0
                h_def = min(1.0, m.home_missing_def / h_mv) if h_mv > 0 else 0
                h_mid = min(1.0, m.home_missing_mid / h_mv) if h_mv > 0 else 0
                a_att = min(1.0, m.away_missing_att / a_mv) if a_mv > 0 else 0
                a_def = min(1.0, m.away_missing_def / a_mv) if a_mv > 0 else 0
                a_mid = min(1.0, m.away_missing_mid / a_mv) if a_mv > 0 else 0
                lh *= max(0.5, 1.0 - (h_att * MISS_ATT + h_mid * MISS_MID)) * (1.0 + a_def * MISS_DEF + a_mid * MISS_MID)
                la *= max(0.5, 1.0 - (a_att * MISS_ATT + a_mid * MISS_MID)) * (1.0 + h_def * MISS_DEF + h_mid * MISS_MID)

            lh = max(0.15, min(lh, 5.5))
            la = max(0.15, min(la, 5.5))

            mg = 10
            ph_l = [math.exp(-lh)]
            for k in range(1, mg + 1): ph_l.append(ph_l[k-1] * lh / k)
            pa_l = [math.exp(-la)]
            for k in range(1, mg + 1): pa_l.append(pa_l[k-1] * la / k)

            dcr = p.get("dc_rho", -0.03)
            phh = pdd = paa = tp = 0.0
            for h in range(mg + 1):
                for a in range(mg + 1):
                    pp = ph_l[h] * pa_l[a]
                    if h == 0 and a == 0: pp *= max(0, 1 - lh * la * dcr)
                    elif h == 1 and a == 0: pp *= max(0, 1 + la * dcr)
                    elif h == 0 and a == 1: pp *= max(0, 1 + lh * dcr)
                    elif h == 1 and a == 1: pp *= max(0, 1 - dcr)
                    tp += pp
                    if h > a: phh += pp
                    elif h == a: pdd += pp
                    else: paa += pp

            phh /= tp; pdd /= tp; paa /= tp
            pdd *= p.get("draw_boost", 1.0)
            t1 = phh + pdd + paa; phh /= t1; pdd /= t1; paa /= t1

            temp = p.get("temp", 1.0)
            if temp != 1.0:
                phh = math.pow(phh, 1.0 / temp); pdd = math.pow(pdd, 1.0 / temp); paa = math.pow(paa, 1.0 / temp)
                tt = phh + pdd + paa; phh /= tt; pdd /= tt; paa /= tt

            pr = sorted([(phh, "H"), (pdd, "D"), (paa, "A")], reverse=True)
            pred = pr[0][1]
            actual = "H" if m.home_goals > m.away_goals else ("A" if m.away_goals > m.home_goals else "D")
            if pred == actual: correct += 1
            total += 1
            ap_d = {"H": 0.0, "D": 0.0, "A": 0.0}
            ap_d[actual] = 1.0
            brier += (phh - ap_d["H"]) ** 2 + (pdd - ap_d["D"]) ** 2 + (paa - ap_d["A"]) ** 2

        # --- Guncelleme ---
        ham = 1.0
        if home.home_xg_diffs:
            ham += sum(home.home_xg_diffs) / len(home.home_xg_diffs) * 0.2
        ra = home.elo + p.get("home_adv", 40.0) * max(0.5, ham)
        rb = away.elo
        ea = 1.0 / (1.0 + math.pow(10.0, (rb - ra) / 400.0))
        sa = 1.0 if m.home_goals > m.away_goals else (0.0 if m.home_goals < m.away_goals else 0.5)
        gd = abs(m.home_goals - m.away_goals)
        k = p.get("k_base", 18.0) * math.pow(1.0 + gd, 0.7)
        elo_delta = k * (sa - ea)

        hn = max(0.01, m.home_xg - m.home_pen * 0.79)
        an = max(0.01, m.away_xg - m.away_pen * 0.79)
        hsq = 0.8 + min(m.home_sot, 10) * p.get("sot_weight", 0.1)
        asq = 0.8 + min(m.away_sot, 10) * p.get("sot_weight", 0.1)
        h_sh = m.home_sot / max(m.home_shots, 1)
        a_sh = m.away_sot / max(m.away_shots, 1)
        h_ab = 1.0 + (h_sh - 0.35) * p.get("acc_weight", 0.25)
        a_ab = 1.0 + (a_sh - 0.35) * p.get("acc_weight", 0.25)
        h_pf = 1.0 + (m.home_poss - 50) * p.get("poss_weight", 0.001)
        a_pf = 1.0 + (m.away_poss - 50) * p.get("poss_weight", 0.001)
        h_cb = 1.0 + max(0, m.home_corners - 4) * p.get("corner_weight", 0.05)
        a_cb = 1.0 + max(0, m.away_corners - 4) * p.get("corner_weight", 0.05)

        hadj = hn * hsq * h_ab * h_pf * h_cb
        aadj = an * asq * a_ab * a_pf * a_cb

        xg_sa = sigmoid((hadj - aadj) * 1.5)
        xg_delta = k * (xg_sa - ea)
        bl = (1.0 - p.get("xg_blend", 0.25)) * elo_delta + p.get("xg_blend", 0.25) * xg_delta

        if m.home_kk > 0 and bl < 0: bl *= max(0.2, 1.0 - m.home_kk * 0.4)
        elif m.away_kk > 0 and bl > 0: bl *= max(0.2, 1.0 - m.away_kk * 0.4)

        home.elo += bl; away.elo -= bl
        al = p.get("alpha", 0.08)

        if home.matches > 0:
            home.xg_attack  = (1 - al) * home.xg_attack  + al * (hn / league_avg)
            home.xg_defense = (1 - al) * home.xg_defense + al * (an / league_avg)
        else:
            home.xg_attack = hn / league_avg; home.xg_defense = an / league_avg

        if away.matches > 0:
            away.xg_attack  = (1 - al) * away.xg_attack  + al * (an / league_avg)
            away.xg_defense = (1 - al) * away.xg_defense + al * (hn / league_avg)
        else:
            away.xg_attack = an / league_avg; away.xg_defense = hn / league_avg

        home.matches += 1; away.matches += 1
        home.last_match_date = m.tarih; away.last_match_date = m.tarih

        if m.home_goals > m.away_goals: home.wins += 1; away.losses += 1
        elif m.home_goals < m.away_goals: home.losses += 1; away.wins += 1
        else: home.draws += 1; away.draws += 1

        total_xg += hn + an; tm_count += 1
        league_avg = max(1.0, total_xg / (tm_count * 2))

        for lst, val in [
            (home.recent_xg_diffs, hadj - aadj), (away.recent_xg_diffs, aadj - hadj),
            (home.recent_results, sa), (away.recent_results, 1.0 - sa),
            (home.home_xg_diffs, hadj - aadj),
            (home.recent_goals_scored, m.home_goals), (home.recent_goals_conceded, m.away_goals),
            (away.recent_goals_scored, m.away_goals), (away.recent_goals_conceded, m.home_goals),
            (home.recent_possession, m.home_poss), (away.recent_possession, m.away_poss),
            (home.recent_shot_accuracy, h_sh), (away.recent_shot_accuracy, a_sh),
            (home.recent_corners, m.home_corners), (away.recent_corners, m.away_corners),
        ]:
            lst.append(val)
            if len(lst) > FL: lst.pop(0)

    return correct, total, brier


def evaluate_global(
    leagues_data: List[List[MatchRecord]],
    market_values: Dict[str, float],
    p: dict,
) -> Tuple[float, float, int, int]:
    total_c = total_t = 0
    total_brier = 0.0
    for matches in leagues_data:
        c, t, b = evaluate_league(matches, market_values, p)
        total_c += c; total_t += t; total_brier += b
    acc = total_c / total_t if total_t > 0 else 0.0
    brier_avg = total_brier / total_t if total_t > 0 else 999.0
    return acc, brier_avg, total_c, total_t
