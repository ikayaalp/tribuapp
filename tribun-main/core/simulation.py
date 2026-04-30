"""
core/simulation.py
Dixon-Coles duzeltmeli Poisson simulasyon motoru.
"""
import math
from typing import List

from core.math_utils import poisson_pmf


def dixon_coles_tau(h: int, a: int, lh: float, la: float, rho: float) -> float:
    if h == 0 and a == 0: return max(0.0, 1.0 - lh * la * rho)
    if h == 1 and a == 0: return max(0.0, 1.0 + la * rho)
    if h == 0 and a == 1: return max(0.0, 1.0 + lh * rho)
    if h == 1 and a == 1: return max(0.0, 1.0 - rho)
    return 1.0


class SimulationEngine:
    """
    Optimize parametreler: dc_rho=-0.0848, temp=1.3749, draw_boost=1.0
    """

    def __init__(self):
        self.dc_rho: float = -0.0848
        self.temp: float = 1.374926
        self.draw_boost: float = 1.0

    def simulate(self, lam_h: float, lam_a: float) -> dict:
        max_g = 10
        pmf_h = poisson_pmf(lam_h, max_g)
        pmf_a = poisson_pmf(lam_a, max_g)

        matrix: List[List[float]] = [[0.0] * (max_g + 1) for _ in range(max_g + 1)]
        total = 0.0

        for h in range(max_g + 1):
            for a in range(max_g + 1):
                p = pmf_h[h] * pmf_a[a] * dixon_coles_tau(h, a, lam_h, lam_a, self.dc_rho)
                matrix[h][a] = p
                total += p

        for h in range(max_g + 1):
            for a in range(max_g + 1):
                matrix[h][a] /= total

        p_home = p_draw = p_away = 0.0
        o25 = btts = 0.0
        exp_h = exp_a = 0.0

        for h in range(max_g + 1):
            for a in range(max_g + 1):
                p = matrix[h][a]
                if h > a:   p_home += p
                elif h == a: p_draw += p
                else:        p_away += p
                if h + a > 2:  o25 += p
                if h > 0 and a > 0: btts += p
                exp_h += h * p
                exp_a += a * p

        p_draw *= self.draw_boost
        t = p_home + p_draw + p_away
        p_home /= t; p_draw /= t; p_away /= t

        if self.temp != 1.0:
            p_home = math.pow(p_home, 1.0 / self.temp)
            p_draw = math.pow(p_draw, 1.0 / self.temp)
            p_away = math.pow(p_away, 1.0 / self.temp)
            t = p_home + p_draw + p_away
            p_home /= t; p_draw /= t; p_away /= t

        return {
            "p_home": p_home, "p_draw": p_draw, "p_away": p_away,
            "o25": o25, "btts": btts,
            "exp_h": exp_h, "exp_a": exp_a,
            "matrix": matrix,
        }
