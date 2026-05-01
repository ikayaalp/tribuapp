"""
api.py
FastAPI REST API — sadece HTTP katmani.
Tahmin mantigi: core/ | Veri: data/ | Optimizasyon: optimizer/
"""
import os
import sys
import threading
from contextlib import asynccontextmanager
from typing import Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine import build_global_ratings
from core.predictor import predict_match
from optimizer.auto import ensure_params_fresh, run_optimization
from data.registry import DATA_FILES

# ─── Global state ────────────────────────────────────────────────────────────
global_ratings = None
market_values: dict = {}
_ready = False
_optimizer_lock = threading.Lock()


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global global_ratings, market_values, _ready

    print("[API] Parametreler kontrol ediliyor...")
    ensure_params_fresh(verbose=True)

    print("[API] Futbol tahmin modeli yukleniyor...")
    global_ratings, market_values, _ = build_global_ratings()
    _ready = True
    print(f"[API] {len(global_ratings.ratings)} takim yuklendi. API hazir.")

    yield

    print("[API] Kapatiliyor.")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Futbol Tahmin API",
    description="Elo + xG hibrit modeli ile cok ligli futbol mac tahmin servisi.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────
class MissingPlayers(BaseModel):
    attack:   float = 0.0
    defense:  float = 0.0
    midfield: float = 0.0


class PredictRequest(BaseModel):
    home:          str
    away:          str
    date:          Optional[str] = None
    home_missing:  MissingPlayers = MissingPlayers()
    away_missing:  MissingPlayers = MissingPlayers()


class OptimizeRequest(BaseModel):
    force: bool = False


# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health", summary="API saglik kontrolu")
def health():
    if not _ready:
        raise HTTPException(status_code=503, detail="Model henuz yuklenmedi")
    return {
        "status": "ok",
        "loaded_teams": len(global_ratings.ratings),
        "model": "Elo + xG Hybrid (Global Multi-League)",
        "leagues": list(DATA_FILES.keys()),
    }


@app.get("/teams", summary="Takim listesi")
def get_teams(search: Optional[str] = None):
    if not _ready:
        raise HTTPException(status_code=503, detail="Model henuz yuklenmedi")
    teams = sorted(global_ratings.ratings.keys())
    if search:
        s = search.lower()
        teams = [t for t in teams if s in t.lower()]
    return {"count": len(teams), "teams": teams}


@app.post("/predict", summary="Mac tahmini")
def predict(req: PredictRequest):
    if not _ready:
        raise HTTPException(status_code=503, detail="Model henuz yuklenmedi")

    if req.date:
        # Tarih verildiyse o tarihten önceki maçlarla yeni bir geçici sistem kur
        ratings_to_use, _, _ = build_global_ratings(up_to_date=req.date)
    else:
        ratings_to_use = global_ratings

    result = predict_match(
        home=req.home,
        away=req.away,
        ratings=ratings_to_use,
        h_miss_att=req.home_missing.attack,
        h_miss_def=req.home_missing.defense,
        h_miss_mid=req.home_missing.midfield,
        a_miss_att=req.away_missing.attack,
        a_miss_def=req.away_missing.defense,
        a_miss_mid=req.away_missing.midfield,
    )

    if result is None or "error" in result:
        raise HTTPException(
            status_code=404,
            detail=result.get("error", "Takim bulunamadi") if result else "Tahmin baskisiz",
        )
    return result


@app.post("/optimize", summary="Parametreleri yeniden optimize et")
def optimize(req: OptimizeRequest):
    """
    force=False: sadece parametreler eskiyse optimize eder.
    force=True : her durumda yeniden optimize eder.
    """
    if not _optimizer_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Optimizasyon zaten devam ediyor")

    try:
        if req.force:
            result = run_optimization(verbose=True)
        else:
            result = ensure_params_fresh(verbose=True)
            if result is None:
                return {"status": "skipped", "message": "Parametreler guncel, optimizasyon atlanıldı"}

        # Modeli yeniden yukle
        global global_ratings, market_values, _ready
        _ready = False
        global_ratings, market_values, _ = build_global_ratings()
        _ready = True

        return {"status": "completed", **result}
    finally:
        _optimizer_lock.release()


# ─── Direkt calistirma ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
