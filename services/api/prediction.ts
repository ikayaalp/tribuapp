/**
 * prediction.ts
 * tribun-main FastAPI tahmin motoruna istek atan servis.
 * Lokal: http://localhost:8000
 * Vercel: PREDICTION_API_URL env ile değiştirilebilir.
 */

const API_BASE = process.env.EXPO_PUBLIC_PREDICTION_API_URL || 'http://localhost:8000';

export interface PredictionResult {
  home: string;
  away: string;
  elo: { home: number; away: number; diff: number };
  probabilities: { home_win: number; draw: number; away_win: number };
  prediction: { result: string; confidence: string; confidence_pct: number };
  expected_goals: { home: number; away: number; lambda_home: number; lambda_away: number };
  over_under: Record<string, { over: number; under: number }>;
  btts: number;
  form: {
    home: { xg_diff: number; last_result_score: number };
    away: { xg_diff: number; last_result_score: number };
  };
  stats: {
    home: { possession: number; shot_accuracy: number; corners: number };
    away: { possession: number; shot_accuracy: number; corners: number };
  };
  top_scores: { home_goals: number; away_goals: number; probability: number }[];
}

export const predictionApi = {
  /**
   * İki takım arasındaki maç tahmini
   */
  predict: async (home: string, away: string): Promise<PredictionResult | null> => {
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home,
          away,
          home_missing: { attack: 0, defense: 0, midfield: 0 },
          away_missing: { attack: 0, defense: 0, midfield: 0 },
        }),
      });
      if (!res.ok) {
        console.warn(`Prediction API error: ${res.status}`);
        return null;
      }
      return await res.json();
    } catch (e) {
      console.warn('Prediction API unreachable:', e);
      return null;
    }
  },

  /**
   * API sağlık kontrolü
   */
  health: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Takım listesi deneme
   */
  searchTeams: async (query?: string): Promise<string[]> => {
    try {
      const url = query ? `${API_BASE}/teams?search=${encodeURIComponent(query)}` : `${API_BASE}/teams`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.teams || [];
    } catch {
      return [];
    }
  },
};
