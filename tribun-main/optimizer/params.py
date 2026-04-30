"""
optimizer/params.py
Baseline parametreler ve aday degerler sozlukleri.
"""

BASELINE_PARAMS: dict = {
    "k_base": 18.0,
    "xg_blend": 0.25,
    "home_adv": 40.0,
    "alpha": 0.08,
    "mv_weight": 100.0,
    "sot_weight": 0.10,
    "poss_weight": 0.001,
    "corner_weight": 0.05,
    "acc_weight": 0.25,
    "mu_home": 1.49,
    "mu_away": 1.16,
    "form_weight": 0.20,
    "fatigue": 0.88,
    "poss_lam": 0.001,
    "cor_lam": 0.08,
    "acc_lam": 0.20,
    "miss_att": 0.40,
    "miss_def": 1.00,
    "miss_mid": 0.05,
    "dc_rho": -0.03,
    "draw_boost": 1.0,
    "temp": 0.95,
    "elo_lam": 0.0,
    "form_len": 5,
    "test_start": 20,
}

# Lig bazlı hibrit optimizasyon adayları
LEAGUE_CANDIDATES: dict = {
    "k_base":      [12, 18, 24, 30, 40],
    "alpha":       [0.05, 0.08, 0.12, 0.18],
    "form_weight": [0.10, 0.20, 0.30, 0.40],
    "home_adv":    [25, 35, 45, 55],
    "mu_home":     [1.30, 1.45, 1.60, 1.75],
    "mu_away":     [1.00, 1.15, 1.30, 1.45],
    "sot_weight":  [0.02, 0.08, 0.15],
    "acc_weight":  [0.10, 0.20, 0.35],
    "dc_rho":      [-0.15, -0.08, -0.03, 0.0, 0.05],
    "draw_boost":  [0.80, 0.95, 1.10, 1.25],
    "temp":        [0.85, 1.0, 1.15, 1.30],
    "miss_att":    [0.0, 0.5, 1.5, 2.5],
    "miss_def":    [0.0, 0.5, 1.5, 2.5],
}

# Global optimizasyon adayları (tüm ligler)
GLOBAL_CANDIDATES: dict = {
    "miss_att":    [0.0, 0.40, 0.80, 1.20, 1.60, 2.00],
    "miss_def":    [0.25, 0.50, 0.75, 1.00, 1.50, 2.00, 2.50],
    "miss_mid":    [0.0, 0.05, 0.10, 0.15, 0.25, 0.35],
    "home_adv":    [25, 30, 35, 40, 45, 50, 55],
    "mv_weight":   [50, 75, 100, 125, 150, 200],
    "mu_home":     [1.30, 1.38, 1.44, 1.49, 1.55, 1.62, 1.70],
    "mu_away":     [1.00, 1.06, 1.12, 1.16, 1.22, 1.28],
    "k_base":      [12, 15, 18, 20, 22, 26],
    "alpha":       [0.05, 0.07, 0.09, 0.11, 0.13, 0.15],
    "xg_blend":    [0.10, 0.15, 0.20, 0.25, 0.30, 0.40],
    "sot_weight":  [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15],
    "acc_weight":  [0.05, 0.10, 0.15, 0.20, 0.25, 0.35],
    "poss_lam":    [0.0003, 0.0005, 0.001, 0.0012, 0.002],
    "cor_lam":     [0.05, 0.08, 0.12, 0.15, 0.18, 0.22],
    "acc_lam":     [0.10, 0.15, 0.20, 0.25, 0.30, 0.35],
    "form_weight": [0.05, 0.08, 0.10, 0.15, 0.20, 0.25],
    "dc_rho":      [-0.12, -0.08, -0.05, -0.03, -0.01, 0.0],
    "draw_boost":  [0.85, 0.90, 0.95, 1.0, 1.05, 1.10],
    "temp":        [0.80, 0.85, 0.90, 0.95, 1.0, 1.05, 1.10, 1.19],
}
