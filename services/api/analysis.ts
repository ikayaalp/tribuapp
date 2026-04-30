import { fetchPopularMatches } from './sportmonks';
import { predictionApi } from './prediction';

export interface Analysis {
  id: string;
  match: string;
  prediction: string;
  confidence: string;
  odds: string;
  description: string;
  confidence_pct?: number;
}

export const analysisApi = {
  getAnalyses: async (): Promise<Analysis[]> => {
    try {
      // 1. Günün maçlarını al
      const matches = await fetchPopularMatches();
      if (!matches || matches.length === 0) return [];

      const analyses: Analysis[] = [];

      // Sadece 15-20 maç sınırı koyalım (API'yi çok yormamak için)
      const matchesToProcess = matches.slice(0, 15);

      // 2. Her maç için tahmin API'sini çağır
      for (const match of matchesToProcess) {
        const homeTeam = match.participants.find(p => p.meta.location === 'home')?.name;
        const awayTeam = match.participants.find(p => p.meta.location === 'away')?.name;

        if (homeTeam && awayTeam) {
          const pred = await predictionApi.predict(homeTeam, awayTeam);
          if (pred) {
            // Güven skorunu ve seçimi bul
            const p = pred.probabilities;
            let predictionStr = '';
            let confVal = 0;
            
            if (p.home_win > p.away_win && p.home_win > p.draw) {
              predictionStr = 'MS 1 (Ev Sahibi)';
              confVal = p.home_win;
            } else if (p.away_win > p.home_win && p.away_win > p.draw) {
              predictionStr = 'MS 2 (Deplasman)';
              confVal = p.away_win;
            } else {
              predictionStr = 'MS 0 (Beraberlik)';
              confVal = p.draw;
            }

            // Description oluştur
            const desc = `${homeTeam} (Elo: ${pred.elo.home.toFixed(0)}) vs ${awayTeam} (Elo: ${pred.elo.away.toFixed(0)}). Beklenen gol (xG): ${pred.expected_goals.home.toFixed(2)} - ${pred.expected_goals.away.toFixed(2)}. KG Var ihtimali: %${pred.btts}. Yapay Zeka analizine göre bu karşılaşmada ${confVal > 50 ? 'belirgin bir favori var' : 'dengeli bir maç geçmesi bekleniyor'}.`;

            analyses.push({
              id: match.id.toString(),
              match: `${homeTeam} - ${awayTeam}`,
              prediction: predictionStr,
              confidence: `%${confVal.toFixed(1)}`,
              confidence_pct: confVal,
              odds: (100 / confVal).toFixed(2), // Olasılığa göre adil oran hesaplama (implied probability)
              description: desc
            });
          }
        }
      }

      // 3. Güven skoruna göre sırala (en yüksekten düşüğe)
      analyses.sort((a, b) => (b.confidence_pct || 0) - (a.confidence_pct || 0));

      // 4. En iyi 5 maçı döndür
      return analyses.slice(0, 5);
      
    } catch (e) {
      console.error('getAnalyses error:', e);
      return [];
    }
  }
};
