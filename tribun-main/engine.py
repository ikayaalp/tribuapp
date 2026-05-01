"""
engine.py
Tum ligleri yukler, RatingSystem'leri olusturur ve global_ratings dondurur.
"""
import json
import math
import os
from typing import Dict, Tuple

from core.rating import RatingSystem
from data.loader import read_market_values, read_matches
from data.registry import DATA_FILES, BASE_DIR, csv_path, MARKET_VALUES_FILE, params_path


def build_global_ratings(up_to_date: str = None) -> Tuple[RatingSystem, Dict[str, float], float]:
    """
    Tum ligleri yukler, her lig icin ayri RatingSystem olusturur,
    sonra global bir RatingSystem'e birlestirip dondurur.

    Donusler: (global_ratings, market_values, median_val)
    """
    mv_path = csv_path(MARKET_VALUES_FILE)
    market_values = read_market_values(mv_path)
    values = sorted(market_values.values())
    median_val = values[len(values) // 2] if values else 1.0

    p_path = params_path()
    try:
        with open(p_path, "r", encoding="utf-8") as f:
            league_params_dict = json.load(f)
    except Exception:
        league_params_dict = {}

    league_rating_systems: Dict[str, Tuple[RatingSystem, list]] = {}

    for lig_name, csv_file in DATA_FILES.items():
        mlist = read_matches(csv_path(csv_file))
        rs = RatingSystem()
        p = league_params_dict.get(lig_name, {}).get("params", None)

        if p:
            rs.home_adv      = p.get("home_adv",      rs.home_adv)
            rs.k_base        = p.get("k_base",         rs.k_base)
            rs.xg_blend      = p.get("xg_blend",       rs.xg_blend)
            rs.alpha         = p.get("alpha",           rs.alpha)
            rs.sot_weight    = p.get("sot_weight",      rs.sot_weight)
            rs.acc_weight    = p.get("acc_weight",      rs.acc_weight)
            rs.poss_weight   = p.get("poss_weight",     rs.poss_weight)
            rs.corner_weight = p.get("corner_weight",   rs.corner_weight)

        for team, val in market_values.items():
            rs.init_team(team, val, median_val)
            ratio = val / median_val
            mv_w = p.get("mv_weight", 100.0) if p else 100.0
            rs.ratings[team].elo = (
                1500.0 + math.log10(ratio) * mv_w if ratio > 0 else 1500.0
            )

        for m in mlist:
            if up_to_date and m.date >= up_to_date:
                continue
            rs.update(m)

        league_rating_systems[lig_name] = (rs, mlist)

    # Global birlestirme
    global_ratings = RatingSystem()
    for lig_name, (rs, mlist) in league_rating_systems.items():
        active = set(m.home_name for m in mlist) | set(m.away_name for m in mlist)
        for name in active:
            if name in rs.ratings:
                global_ratings.ratings[name] = rs.ratings[name]

    return global_ratings, market_values, median_val
