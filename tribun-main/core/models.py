"""
core/models.py
Veri yapilari: MatchRecord ve EloState.
"""
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import date


@dataclass
class MatchRecord:
    id: int
    hafta: int
    tarih: date
    home_name: str
    away_name: str
    home_goals: int
    away_goals: int
    home_xg: float
    away_xg: float
    home_kk: int
    away_kk: int
    home_pen: int
    away_pen: int
    home_sot: int
    away_sot: int
    home_poss: int
    away_poss: int
    home_shots: int
    away_shots: int
    home_corners: int
    away_corners: int
    home_missing_att: float = 0.0
    home_missing_def: float = 0.0
    home_missing_mid: float = 0.0
    away_missing_att: float = 0.0
    away_missing_def: float = 0.0
    away_missing_mid: float = 0.0


@dataclass
class EloState:
    elo: float = 1500.0
    xg_attack: float = 1.0
    xg_defense: float = 1.0
    market_value: float = 10.0
    matches: int = 0
    recent_xg_diffs: List[float] = field(default_factory=list)
    recent_results: List[float] = field(default_factory=list)
    home_xg_diffs: List[float] = field(default_factory=list)
    recent_goals_scored: List[int] = field(default_factory=list)
    recent_goals_conceded: List[int] = field(default_factory=list)
    last_match_date: Optional[date] = None
    wins: int = 0
    draws: int = 0
    losses: int = 0
    recent_possession: List[float] = field(default_factory=list)
    recent_shot_accuracy: List[float] = field(default_factory=list)
    recent_corners: List[int] = field(default_factory=list)
