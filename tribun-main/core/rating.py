"""
core/rating.py
RatingSystem: Elo + xG guncelleme motoru.
"""
import math
from typing import Dict

from core.models import MatchRecord, EloState
from core.math_utils import sigmoid, elo_expected


class RatingSystem:
    """
    Optimize edilmis parametreler (61.9% accuracy):
    k_base=18, xg_blend=0.25, home_adv=40, alpha=0.08
    """

    def __init__(self):
        self.ratings: Dict[str, EloState] = {}
        self.home_adv: float = 40.0
        self.k_base: float = 18.0
        self.k_margin_exp: float = 0.7
        self.xg_blend: float = 0.25
        self.league_avg: float = 1.35
        self.total_xg: float = 0.0
        self.total_matches: int = 0
        self.alpha: float = 0.08
        self.sot_weight: float = 0.08827
        self.form_len: int = 5
        self.poss_weight: float = 0.001
        self.corner_weight: float = 0.05
        self.acc_weight: float = 0.2

    def init_team(self, team_name: str, market_value: float, median_value: float) -> None:
        if team_name not in self.ratings:
            self.ratings[team_name] = EloState()
            self.ratings[team_name].market_value = market_value
            ratio = market_value / median_value
            if ratio > 0:
                self.ratings[team_name].elo = 1500.0 + math.log10(ratio) * 100.0

    def update(self, m: MatchRecord) -> None:
        if m.home_name not in self.ratings:
            self.ratings[m.home_name] = EloState()
        if m.away_name not in self.ratings:
            self.ratings[m.away_name] = EloState()

        home = self.ratings[m.home_name]
        away = self.ratings[m.away_name]

        # Ev sahibi avantaji
        home_adv_multiplier = 1.0
        if home.home_xg_diffs:
            avg_home_diff = sum(home.home_xg_diffs) / len(home.home_xg_diffs)
            home_adv_multiplier += avg_home_diff * 0.2

        ra = home.elo + (self.home_adv * max(0.5, home_adv_multiplier))
        rb = away.elo
        ea = elo_expected(ra, rb)

        sa = 1.0 if m.home_goals > m.away_goals else (0.0 if m.home_goals < m.away_goals else 0.5)
        gd = abs(m.home_goals - m.away_goals)
        k = self.k_base * math.pow(1.0 + gd, self.k_margin_exp)
        elo_delta = k * (sa - ea)

        # Non-penalty xG + SoT
        home_npxg = max(0.01, m.home_xg - m.home_pen * 0.79)
        away_npxg = max(0.01, m.away_xg - m.away_pen * 0.79)

        h_sot_q = 0.8 + min(m.home_sot, 10) * self.sot_weight
        a_sot_q = 0.8 + min(m.away_sot, 10) * self.sot_weight

        h_shot_acc = m.home_sot / max(m.home_shots, 1)
        a_shot_acc = m.away_sot / max(m.away_shots, 1)
        h_acc_b = 1.0 + (h_shot_acc - 0.35) * self.acc_weight
        a_acc_b = 1.0 + (a_shot_acc - 0.35) * self.acc_weight

        h_poss_f = 1.0 + (m.home_poss - 50) * self.poss_weight
        a_poss_f = 1.0 + (m.away_poss - 50) * self.poss_weight

        h_corn_b = 1.0 + max(0, m.home_corners - 4) * self.corner_weight
        a_corn_b = 1.0 + max(0, m.away_corners - 4) * self.corner_weight

        home_adj = home_npxg * h_sot_q * h_acc_b * h_poss_f * h_corn_b
        away_adj = away_npxg * a_sot_q * a_acc_b * a_poss_f * a_corn_b

        xg_sa = sigmoid((home_adj - away_adj) * 1.5)
        xg_delta = k * (xg_sa - ea)
        blended = (1.0 - self.xg_blend) * elo_delta + self.xg_blend * xg_delta

        # Kirmizi kart damping
        if m.home_kk > 0 and blended < 0:
            blended *= max(0.2, 1.0 - m.home_kk * 0.4)
        elif m.away_kk > 0 and blended > 0:
            blended *= max(0.2, 1.0 - m.away_kk * 0.4)

        home.elo += blended
        away.elo -= blended

        # xG strength (EMA)
        al = self.alpha
        if home.matches > 0:
            home.xg_attack  = (1 - al) * home.xg_attack  + al * (home_npxg / self.league_avg)
            home.xg_defense = (1 - al) * home.xg_defense + al * (away_npxg / self.league_avg)
        else:
            home.xg_attack  = home_npxg / self.league_avg
            home.xg_defense = away_npxg / self.league_avg

        if away.matches > 0:
            away.xg_attack  = (1 - al) * away.xg_attack  + al * (away_npxg / self.league_avg)
            away.xg_defense = (1 - al) * away.xg_defense + al * (home_npxg / self.league_avg)
        else:
            away.xg_attack  = away_npxg / self.league_avg
            away.xg_defense = home_npxg / self.league_avg

        home.matches += 1
        away.matches += 1
        home.last_match_date = m.tarih
        away.last_match_date = m.tarih

        if m.home_goals > m.away_goals:
            home.wins += 1; away.losses += 1
        elif m.home_goals < m.away_goals:
            home.losses += 1; away.wins += 1
        else:
            home.draws += 1; away.draws += 1

        self.total_xg += home_npxg + away_npxg
        self.total_matches += 1
        self.league_avg = max(1.0, self.total_xg / (self.total_matches * 2))

        FL = self.form_len
        home.recent_xg_diffs.append(home_adj - away_adj)
        if len(home.recent_xg_diffs) > FL: home.recent_xg_diffs.pop(0)
        away.recent_xg_diffs.append(away_adj - home_adj)
        if len(away.recent_xg_diffs) > FL: away.recent_xg_diffs.pop(0)

        home.recent_results.append(sa)
        if len(home.recent_results) > FL: home.recent_results.pop(0)
        away.recent_results.append(1.0 - sa)
        if len(away.recent_results) > FL: away.recent_results.pop(0)

        home.home_xg_diffs.append(home_adj - away_adj)
        if len(home.home_xg_diffs) > FL: home.home_xg_diffs.pop(0)

        home.recent_goals_scored.append(m.home_goals)
        if len(home.recent_goals_scored) > FL: home.recent_goals_scored.pop(0)
        home.recent_goals_conceded.append(m.away_goals)
        if len(home.recent_goals_conceded) > FL: home.recent_goals_conceded.pop(0)
        away.recent_goals_scored.append(m.away_goals)
        if len(away.recent_goals_scored) > FL: away.recent_goals_scored.pop(0)
        away.recent_goals_conceded.append(m.home_goals)
        if len(away.recent_goals_conceded) > FL: away.recent_goals_conceded.pop(0)

        home.recent_possession.append(m.home_poss)
        if len(home.recent_possession) > FL: home.recent_possession.pop(0)
        away.recent_possession.append(m.away_poss)
        if len(away.recent_possession) > FL: away.recent_possession.pop(0)

        home.recent_shot_accuracy.append(h_shot_acc)
        if len(home.recent_shot_accuracy) > FL: home.recent_shot_accuracy.pop(0)
        away.recent_shot_accuracy.append(a_shot_acc)
        if len(away.recent_shot_accuracy) > FL: away.recent_shot_accuracy.pop(0)

        home.recent_corners.append(m.home_corners)
        if len(home.recent_corners) > FL: home.recent_corners.pop(0)
        away.recent_corners.append(m.away_corners)
        if len(away.recent_corners) > FL: away.recent_corners.pop(0)
