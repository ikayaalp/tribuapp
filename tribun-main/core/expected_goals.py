"""
core/expected_goals.py
ExpectedGoalsModel: Lambda hesaplama motoru.
"""
import math
from datetime import date
from typing import Optional, Tuple

from core.models import EloState, MatchRecord


class ExpectedGoalsModel:
    """
    Optimize parametreler: mu_home=1.49, mu_away=1.16, form_weight=0.194
    """

    def __init__(self):
        self.mu_home: float = 1.49
        self.mu_away: float = 1.16
        self.form_weight: float = 0.194
        self.fatigue_discount: float = 0.88
        self.poss_lam: float = 0.00194
        self.cor_lam: float = 0.0728
        self.acc_lam: float = 0.21836
        self.miss_att_coef: float = 0.00327
        self.miss_def_coef: float = 2.5
        self.miss_mid_coef: float = 0.265

    def compute(
        self,
        home: EloState,
        away: EloState,
        match_date: Optional[date] = None,
        match_record: Optional[MatchRecord] = None,
    ) -> Tuple[float, float]:
        home_form = (
            sum(home.recent_xg_diffs) / len(home.recent_xg_diffs)
            if home.recent_xg_diffs else 0.0
        )
        away_form = (
            sum(away.recent_xg_diffs) / len(away.recent_xg_diffs)
            if away.recent_xg_diffs else 0.0
        )

        lam_h = self.mu_home * home.xg_attack * away.xg_defense * 1.05 + home_form * self.form_weight
        lam_a = self.mu_away * away.xg_attack * home.xg_defense + away_form * self.form_weight

        # Top hakimiyeti
        if home.recent_possession:
            h_poss = sum(home.recent_possession) / len(home.recent_possession)
            a_poss = sum(away.recent_possession) / len(away.recent_possession)
            lam_h *= 1.0 + (h_poss - 50) * self.poss_lam
            lam_a *= 1.0 + (a_poss - 50) * self.poss_lam

        # Korner
        if home.recent_corners:
            h_cor = sum(home.recent_corners) / len(home.recent_corners)
            a_cor = sum(away.recent_corners) / len(away.recent_corners)
            lam_h += max(0, h_cor - 4) * self.cor_lam
            lam_a += max(0, a_cor - 4) * self.cor_lam

        # Sut dogrulugu
        if home.recent_shot_accuracy:
            h_acc = sum(home.recent_shot_accuracy) / len(home.recent_shot_accuracy)
            a_acc = sum(away.recent_shot_accuracy) / len(away.recent_shot_accuracy)
            lam_h *= 1.0 + (h_acc - 0.35) * self.acc_lam
            lam_a *= 1.0 + (a_acc - 0.35) * self.acc_lam

        # Yorgunluk
        if match_date:
            if home.last_match_date and (match_date - home.last_match_date).days <= 3:
                lam_h *= self.fatigue_discount
            if away.last_match_date and (match_date - away.last_match_date).days <= 3:
                lam_a *= self.fatigue_discount

        # Eksik oyuncular
        if match_record:
            h_mv = getattr(home, "market_value", 10_000_000.0) / 1_000_000.0
            a_mv = getattr(away, "market_value", 10_000_000.0) / 1_000_000.0

            h_att_pct = min(1.0, match_record.home_missing_att / h_mv) if h_mv > 0 else 0.0
            h_def_pct = min(1.0, match_record.home_missing_def / h_mv) if h_mv > 0 else 0.0
            h_mid_pct = min(1.0, match_record.home_missing_mid / h_mv) if h_mv > 0 else 0.0
            a_att_pct = min(1.0, match_record.away_missing_att / a_mv) if a_mv > 0 else 0.0
            a_def_pct = min(1.0, match_record.away_missing_def / a_mv) if a_mv > 0 else 0.0
            a_mid_pct = min(1.0, match_record.away_missing_mid / a_mv) if a_mv > 0 else 0.0

            h_penalty = h_att_pct * self.miss_att_coef + h_mid_pct * self.miss_mid_coef
            a_def_weak = a_def_pct * self.miss_def_coef + a_mid_pct * self.miss_mid_coef
            lam_h *= max(0.5, 1.0 - h_penalty) * (1.0 + a_def_weak)

            a_penalty = a_att_pct * self.miss_att_coef + a_mid_pct * self.miss_mid_coef
            h_def_weak = h_def_pct * self.miss_def_coef + h_mid_pct * self.miss_mid_coef
            lam_a *= max(0.5, 1.0 - a_penalty) * (1.0 + h_def_weak)

        return max(0.15, min(lam_h, 5.5)), max(0.15, min(lam_a, 5.5))
