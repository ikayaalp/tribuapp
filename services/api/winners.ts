import { fetchPopularMatches } from './sportmonks';
import { predictionApi } from './prediction';
import { getTurkeyNow } from '../timezone';

export interface PastPrediction {
  id: string;
  match: string;
  prediction: string;
  actual_score: string;
  is_won: boolean;
  confidence: string;
}

export interface WinnersData {
  predictions: PastPrediction[];
  total: number;
  won: number;
  lost: number;
  success_rate: number;
}

export const winnersApi = {
  getWinners: async (targetDateStr?: string): Promise<WinnersData | null> => {
    try {
      let fetchDate = targetDateStr;
      
      // Eğer tarih verilmemişse dünün tarihini kullan
      if (!fetchDate) {
        const d = new Date(getTurkeyNow());
        d.setDate(d.getDate() - 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        fetchDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }

      const matches = await fetchPopularMatches(fetchDate);
      if (!matches || matches.length === 0) return null;

      const results: PastPrediction[] = [];
      let wonCount = 0;
      let lostCount = 0;

      for (const match of matches.slice(0, 15)) {
        // Sadece bitmiş maçları al
        const sn = match.state?.short_name;
        if (!['FT', 'AET', 'PEN_FT'].includes(sn || '')) continue;

        const homeTeam = match.participants.find(p => p.meta.location === 'home')?.name;
        const awayTeam = match.participants.find(p => p.meta.location === 'away')?.name;
        
        if (!homeTeam || !awayTeam) continue;

        // Gerçek skoru bul
        const homeScores = match.scores.filter((s: any) => s.score?.participant === 'home');
        const awayScores = match.scores.filter((s: any) => s.score?.participant === 'away');
        const hScoreMatch = homeScores.find(s => s.description === 'CURRENT') || homeScores[0];
        const aScoreMatch = awayScores.find(s => s.description === 'CURRENT') || awayScores[0];
        
        const hScore = hScoreMatch ? hScoreMatch.score.goals : 0;
        const aScore = aScoreMatch ? aScoreMatch.score.goals : 0;
        
        let actualOutcome = '0';
        if (hScore > aScore) actualOutcome = '1';
        else if (aScore > hScore) actualOutcome = '2';

        // Tahmin al
        const pred = await predictionApi.predict(homeTeam, awayTeam);
        if (!pred) continue;

        const p = pred.probabilities;
        let predOutcome = '0';
        let confVal = p.draw;
        
        if (p.home_win > p.away_win && p.home_win > p.draw) {
          predOutcome = '1';
          confVal = p.home_win;
        } else if (p.away_win > p.home_win && p.away_win > p.draw) {
          predOutcome = '2';
          confVal = p.away_win;
        }

        const isWon = actualOutcome === predOutcome;
        if (isWon) wonCount++; else lostCount++;

        results.push({
          id: match.id.toString(),
          match: `${homeTeam} - ${awayTeam}`,
          prediction: `MS ${predOutcome}`,
          actual_score: `${hScore} - ${aScore}`,
          is_won: isWon,
          confidence: `%${confVal.toFixed(1)}`
        });
      }
      
      const total = wonCount + lostCount;
      const rate = total > 0 ? (wonCount / total) * 100 : 0;
      
      // Güven skoruna göre sırala
      results.sort((a, b) => parseFloat(b.confidence.replace('%','')) - parseFloat(a.confidence.replace('%','')));

      return {
        predictions: results,
        total,
        won: wonCount,
        lost: lostCount,
        success_rate: Math.round(rate)
      };

    } catch (e) {
      console.error('getWinners error:', e);
      return null;
    }
  }
};
