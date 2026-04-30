"""
core/math_utils.py
Temel matematik yardimci fonksiyonlari.
"""
import math
from typing import List


def sigmoid(x: float) -> float:
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    z = math.exp(x)
    return z / (1.0 + z)


def elo_expected(ra: float, rb: float) -> float:
    return 1.0 / (1.0 + math.pow(10.0, (rb - ra) / 400.0))


def weighted_average(values: List[float]) -> float:
    """Son maclara daha fazla agirlik veren ortalama."""
    if not values:
        return 0.0
    n = len(values)
    weights = [math.pow(0.75, n - 1 - i) for i in range(n)]
    total_w = sum(weights)
    return sum(v * w for v, w in zip(values, weights)) / total_w


def poisson_pmf(lam: float, max_k: int) -> List[float]:
    pmf = [math.exp(-lam)]
    for k in range(1, max_k + 1):
        pmf.append(pmf[k - 1] * lam / k)
    return pmf
