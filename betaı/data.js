// ============================================================
// SÜPER LİG 2025-26 - KAPSAMLI VERİ DOSYASI
// Son güncelleme: 18 Mart 2026
// Kaynaklar: TFF, FotMob, OddAlerts, Transfermarkt
// ============================================================

const SUPER_LIG_DATA = {

  // ─────────────── META BİLGİ ───────────────
  meta: {
    season: "2025-2026",
    league: "Trendyol Süper Lig",
    country: "Türkiye",
    totalTeams: 18,
    lastUpdated: "2026-03-18",
    matchweek: 27,
    seasonStart: "2025-08-08",
    seasonEnd: "2026-05-17",
    totalMarketValue: "1.37 milyar €",
    avgPlayerValue: "2.69 mil. €",
    topPlayer: { name: "Victor Osimhen", team: "Galatasaray", value: "75.00 mil. €" }
  },

  // ─────────────── PUAN TABLOSU ───────────────
  // O=Oynanan, G=Galibiyet, B=Beraberlik, M=Mağlubiyet
  // AG=Atılan Gol, YG=Yenen Gol, AV=Averaj, P=Puan
  standings: [
    { rank: 1,  team: "Galatasaray",       shortName: "GS",  played: 26, won: 20, draw: 4,  lost: 2,  goalsFor: 62, goalsAgainst: 18, goalDiff: 44,  points: 64, zone: "champions" },
    { rank: 2,  team: "Fenerbahçe",        shortName: "FB",  played: 27, won: 17, draw: 9,  lost: 1,  goalsFor: 61, goalsAgainst: 28, goalDiff: 33,  points: 60, zone: "championsLeague" },
    { rank: 3,  team: "Trabzonspor",       shortName: "TS",  played: 26, won: 17, draw: 6,  lost: 3,  goalsFor: 52, goalsAgainst: 29, goalDiff: 23,  points: 57, zone: "championsLeague" },
    { rank: 4,  team: "Beşiktaş",          shortName: "BJK", played: 26, won: 14, draw: 7,  lost: 5,  goalsFor: 47, goalsAgainst: 30, goalDiff: 17,  points: 49, zone: "europaLeague" },
    { rank: 5,  team: "Göztepe",           shortName: "GÖZ", played: 26, won: 11, draw: 10, lost: 5,  goalsFor: 30, goalsAgainst: 20, goalDiff: 10,  points: 43, zone: "conference" },
    { rank: 6,  team: "Başakşehir",        shortName: "IBB", played: 26, won: 12, draw: 6,  lost: 8,  goalsFor: 44, goalsAgainst: 30, goalDiff: 14,  points: 42, zone: "safe" },
    { rank: 7,  team: "Samsunspor",        shortName: "SAM", played: 26, won: 8,  draw: 11, lost: 7,  goalsFor: 29, goalsAgainst: 31, goalDiff: -2,  points: 35, zone: "safe" },
    { rank: 8,  team: "Kocaelispor",       shortName: "KOC", played: 26, won: 9,  draw: 6,  lost: 11, goalsFor: 23, goalsAgainst: 27, goalDiff: -4,  points: 33, zone: "safe" },
    { rank: 9,  team: "Gaziantep FK",      shortName: "GAZ", played: 27, won: 8,  draw: 9,  lost: 10, goalsFor: 36, goalsAgainst: 46, goalDiff: -10, points: 33, zone: "safe" },
    { rank: 10, team: "Çaykur Rizespor",   shortName: "RİZ", played: 26, won: 7,  draw: 9,  lost: 10, goalsFor: 32, goalsAgainst: 36, goalDiff: -4,  points: 30, zone: "safe" },
    { rank: 11, team: "Alanyaspor",        shortName: "ALN", played: 26, won: 5,  draw: 13, lost: 8,  goalsFor: 28, goalsAgainst: 32, goalDiff: -4,  points: 28, zone: "safe" },
    { rank: 12, team: "Konyaspor",         shortName: "KON", played: 26, won: 6,  draw: 9,  lost: 11, goalsFor: 30, goalsAgainst: 39, goalDiff: -9,  points: 27, zone: "safe" },
    { rank: 13, team: "Gençlerbirliği",    shortName: "GEN", played: 26, won: 6,  draw: 7,  lost: 13, goalsFor: 28, goalsAgainst: 36, goalDiff: -8,  points: 25, zone: "danger" },
    { rank: 14, team: "Kasımpaşa",         shortName: "KAS", played: 26, won: 5,  draw: 9,  lost: 12, goalsFor: 22, goalsAgainst: 36, goalDiff: -14, points: 24, zone: "danger" },
    { rank: 15, team: "Antalyaspor",       shortName: "ANT", played: 26, won: 6,  draw: 6,  lost: 14, goalsFor: 25, goalsAgainst: 43, goalDiff: -18, points: 24, zone: "danger" },
    { rank: 16, team: "Eyüpspor",          shortName: "EYÜ", played: 26, won: 5,  draw: 7,  lost: 14, goalsFor: 19, goalsAgainst: 37, goalDiff: -18, points: 22, zone: "relegation" },
    { rank: 17, team: "Kayserispor",       shortName: "KAY", played: 26, won: 3,  draw: 11, lost: 12, goalsFor: 20, goalsAgainst: 48, goalDiff: -28, points: 20, zone: "relegation" },
    { rank: 18, team: "Fatih Karagümrük",  shortName: "FKG", played: 26, won: 4,  draw: 5,  lost: 17, goalsFor: 24, goalsAgainst: 46, goalDiff: -22, points: 17, zone: "relegation" }
  ],

  // ─────────────── xG VERİLERİ ───────────────
  // Kaynak: OddAlerts / FotMob (25 maç sonrası)
  // xG = Beklenen Gol, xGA = Beklenen Gol Yeme
  // xGDiff = Gerçek Gol - xG (pozitif = overperformer)
  // xGPer90 = 90 dakika başına xG
  xgData: [
    { team: "Galatasaray",       xG: 50.11, xGA: 26.1,  xGPer90: 2.00, actualGoals: 59, actualConceded: 18, xGDiff: 8.89,   xGADiff: -8.1,  rating: "overperformer" },
    { team: "Fenerbahçe",        xG: 47.78, xGA: 21.66, xGPer90: 1.91, actualGoals: 57, actualConceded: 28, xGDiff: 9.22,   xGADiff: 6.34,  rating: "overperformer" },
    { team: "Beşiktaş",          xG: 44.31, xGA: 26.7,  xGPer90: 1.77, actualGoals: 45, actualConceded: 30, xGDiff: 0.69,   xGADiff: 3.3,   rating: "balanced" },
    { team: "Trabzonspor",       xG: 40.13, xGA: 33.8,  xGPer90: 1.61, actualGoals: 51, actualConceded: 29, xGDiff: 10.87,  xGADiff: -4.8,  rating: "overperformer" },
    { team: "Başakşehir",        xG: 40.12, xGA: 30.5,  xGPer90: 1.60, actualGoals: 44, actualConceded: 30, xGDiff: 3.88,   xGADiff: -0.5,  rating: "slight-over" },
    { team: "Samsunspor",        xG: 32.97, xGA: 25.1,  xGPer90: 1.32, actualGoals: 27, actualConceded: 31, xGDiff: -5.97,  xGADiff: 5.9,   rating: "underperformer" },
    { team: "Konyaspor",         xG: 32.90, xGA: 34.2,  xGPer90: 1.32, actualGoals: 28, actualConceded: 39, xGDiff: -4.90,  xGADiff: 4.8,   rating: "underperformer" },
    { team: "Göztepe",           xG: 32.33, xGA: 24.8,  xGPer90: 1.29, actualGoals: 28, actualConceded: 20, xGDiff: -4.33,  xGADiff: -4.8,  rating: "mixed" },
    { team: "Çaykur Rizespor",   xG: 30.27, xGA: 33.5,  xGPer90: 1.21, actualGoals: 32, actualConceded: 36, xGDiff: 1.73,   xGADiff: 2.5,   rating: "balanced" },
    { team: "Gaziantep FK",      xG: 29.88, xGA: 38.2,  xGPer90: 1.20, actualGoals: 31, actualConceded: 46, xGDiff: 1.12,   xGADiff: 7.8,   rating: "leaky-defense" },
    { team: "Eyüpspor",          xG: 27.41, xGA: 32.0,  xGPer90: 1.10, actualGoals: 19, actualConceded: 37, xGDiff: -8.41,  xGADiff: 5.0,   rating: "underperformer" },
    { team: "Kayserispor",       xG: 27.29, xGA: 39.5,  xGPer90: 1.09, actualGoals: 19, actualConceded: 48, xGDiff: -8.29,  xGADiff: 8.5,   rating: "underperformer" },
    { team: "Alanyaspor",        xG: 26.56, xGA: 30.8,  xGPer90: 1.06, actualGoals: 26, actualConceded: 32, xGDiff: -0.56,  xGADiff: 1.2,   rating: "balanced" },
    { team: "Kocaelispor",       xG: 25.06, xGA: 28.3,  xGPer90: 1.00, actualGoals: 22, actualConceded: 27, xGDiff: -3.06,  xGADiff: -1.3,  rating: "slight-under" },
    { team: "Gençlerbirliği",    xG: 24.97, xGA: 35.0,  xGPer90: 1.00, actualGoals: 28, actualConceded: 36, xGDiff: 3.03,   xGADiff: 1.0,   rating: "slight-over" },
    { team: "Fatih Karagümrük",  xG: 23.57, xGA: 40.2,  xGPer90: 0.94, actualGoals: 22, actualConceded: 46, xGDiff: -1.57,  xGADiff: 5.8,   rating: "leaky-defense" },
    { team: "Kasımpaşa",         xG: 23.50, xGA: 34.7,  xGPer90: 0.94, actualGoals: 21, actualConceded: 36, xGDiff: -2.50,  xGADiff: 1.3,   rating: "slight-under" },
    { team: "Antalyaspor",       xG: 18.51, xGA: 37.9,  xGPer90: 0.74, actualGoals: 24, actualConceded: 43, xGDiff: 5.49,   xGADiff: 5.1,   rating: "mixed" }
  ],

  // ─────────────── PİYASA DEĞERLERİ ───────────────
  // Kaynak: Transfermarkt (Mart 2026)
  // Değerler milyon Euro cinsinden
  marketValues: [
    { team: "Galatasaray",       squadSize: 29, totalValue: 344.75, avgValue: 11.89, topPlayer: "Victor Osimhen",   topPlayerValue: 75.00, currency: "mil. €" },
    { team: "Fenerbahçe",        squadSize: 27, totalValue: 247.80, avgValue: 9.18,  topPlayer: "Dusan Tadic",      topPlayerValue: 18.00, currency: "mil. €" },
    { team: "Beşiktaş",          squadSize: 28, totalValue: 185.10, avgValue: 6.61,  topPlayer: "Ciro Immobile",    topPlayerValue: 12.00, currency: "mil. €" },
    { team: "Trabzonspor",       squadSize: 27, totalValue: 114.50, avgValue: 4.24,  topPlayer: "Enis Bardhi",      topPlayerValue: 10.00, currency: "mil. €" },
    { team: "Başakşehir",        squadSize: 28, totalValue: 72.10,  avgValue: 2.58,  topPlayer: "Serdar Dursun",    topPlayerValue: 5.00,  currency: "mil. €" },
    { team: "Göztepe",           squadSize: 27, totalValue: 57.13,  avgValue: 2.12,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Samsunspor",        squadSize: 34, totalValue: 52.35,  avgValue: 1.54,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Çaykur Rizespor",   squadSize: 25, totalValue: 40.00,  avgValue: 1.60,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Konyaspor",         squadSize: 30, totalValue: 38.35,  avgValue: 1.28,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Alanyaspor",        squadSize: 26, totalValue: 30.85,  avgValue: 1.19,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Gaziantep FK",      squadSize: 26, totalValue: 30.00,  avgValue: 1.15,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Kayserispor",       squadSize: 30, totalValue: 27.90,  avgValue: 0.93,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Kasımpaşa",         squadSize: 31, totalValue: 27.75,  avgValue: 0.90,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Gençlerbirliği",    squadSize: 33, totalValue: 27.25,  avgValue: 0.83,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Kocaelispor",       squadSize: 25, totalValue: 25.50,  avgValue: 1.02,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Antalyaspor",       squadSize: 28, totalValue: 22.40,  avgValue: 0.80,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Fatih Karagümrük",  squadSize: 30, totalValue: 14.85,  avgValue: 0.50,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" },
    { team: "Eyüpspor",          squadSize: 27, totalValue: 13.75,  avgValue: 0.51,  topPlayer: "-",                topPlayerValue: 0,     currency: "mil. €" }
  ],

  // ─────────────── SON MAÇ SONUÇLARI ───────────────
  // 26. ve 27. Hafta maçları
  recentMatches: [
    // 27. Hafta (13-16 Mart 2026)
    { week: 27, date: "2026-03-13", home: "Antalyaspor",     homeGoals: 1, awayGoals: 4, away: "Gaziantep FK",    stadium: "Antalya Stadyumu" },
    { week: 27, date: "2026-03-13", home: "Fatih Karagümrük", homeGoals: 2, awayGoals: 0, away: "Fenerbahçe",     stadium: "Atatürk Olimpiyat Stadı" },
    { week: 27, date: "2026-03-14", home: "Kocaelispor",     homeGoals: 1, awayGoals: 2, away: "Konyaspor",       stadium: "İzmit Stadyumu" },
    { week: 27, date: "2026-03-14", home: "Göztepe",         homeGoals: 2, awayGoals: 2, away: "Alanyaspor",      stadium: "Gürsel Aksel Stadyumu" },
    { week: 27, date: "2026-03-14", home: "Galatasaray",     homeGoals: 3, awayGoals: 0, away: "Başakşehir",      stadium: "RAMS Park" },
    { week: 27, date: "2026-03-14", home: "Trabzonspor",     homeGoals: 1, awayGoals: 0, away: "Çaykur Rizespor", stadium: "Papara Park" },
    // 26. Hafta (7-10 Mart 2026)
    { week: 26, date: "2026-03-07", home: "Fenerbahçe",      homeGoals: 2, awayGoals: 1, away: "Beşiktaş",        stadium: "Ülker Stadyumu" },
    { week: 26, date: "2026-03-07", home: "Başakşehir",      homeGoals: 0, awayGoals: 1, away: "Galatasaray",     stadium: "Başakşehir Fatih Terim Stadı" },
    { week: 26, date: "2026-03-08", home: "Kayserispor",     homeGoals: 1, awayGoals: 1, away: "Samsunspor",      stadium: "Kadir Has Stadyumu" },
    { week: 26, date: "2026-03-08", home: "Kasımpaşa",       homeGoals: 0, awayGoals: 2, away: "Trabzonspor",     stadium: "Recep Tayyip Erdoğan Stadyumu" },
    { week: 26, date: "2026-03-09", home: "Gençlerbirliği",  homeGoals: 1, awayGoals: 3, away: "Göztepe",         stadium: "Eryaman Stadyumu" },
    { week: 26, date: "2026-03-09", home: "Alanyaspor",      homeGoals: 1, awayGoals: 1, away: "Gaziantep FK",    stadium: "Bahçeşehir Okulları Stadı" },
    { week: 26, date: "2026-03-09", home: "Konyaspor",       homeGoals: 2, awayGoals: 0, away: "Fatih Karagümrük",stadium: "Konya Büyükşehir Stadyumu" },
    { week: 26, date: "2026-03-10", home: "Çaykur Rizespor", homeGoals: 2, awayGoals: 2, away: "Antalyaspor",     stadium: "Çaykur Didi Stadyumu" },
    { week: 26, date: "2026-03-10", home: "Eyüpspor",        homeGoals: 0, awayGoals: 1, away: "Kocaelispor",     stadium: "Recep Tayyip Erdoğan Stadyumu" }
  ],

  // ─────────────── TAKIM RENK KODLARI ───────────────
  teamColors: {
    "Galatasaray":       { primary: "#FDB913", secondary: "#A1171B", text: "#FFFFFF" },
    "Fenerbahçe":        { primary: "#FFED00", secondary: "#003DA5", text: "#FFFFFF" },
    "Beşiktaş":          { primary: "#000000", secondary: "#FFFFFF", text: "#FFFFFF" },
    "Trabzonspor":       { primary: "#7B2D26", secondary: "#00529F", text: "#FFFFFF" },
    "Başakşehir":        { primary: "#F26522", secondary: "#1B3A6B", text: "#FFFFFF" },
    "Göztepe":           { primary: "#FFD700", secondary: "#D32F2F", text: "#000000" },
    "Samsunspor":        { primary: "#D32F2F", secondary: "#FFFFFF", text: "#FFFFFF" },
    "Kocaelispor":       { primary: "#006838", secondary: "#000000", text: "#FFFFFF" },
    "Gaziantep FK":      { primary: "#D32F2F", secondary: "#1A1A1A", text: "#FFFFFF" },
    "Çaykur Rizespor":   { primary: "#006633", secondary: "#003399", text: "#FFFFFF" },
    "Alanyaspor":        { primary: "#F57F20", secondary: "#006838", text: "#FFFFFF" },
    "Konyaspor":         { primary: "#006838", secondary: "#FFFFFF", text: "#FFFFFF" },
    "Gençlerbirliği":    { primary: "#D32F2F", secondary: "#1A1A1A", text: "#FFFFFF" },
    "Kasımpaşa":         { primary: "#1A237E", secondary: "#FFFFFF", text: "#FFFFFF" },
    "Antalyaspor":       { primary: "#D32F2F", secondary: "#FFFFFF", text: "#FFFFFF" },
    "Eyüpspor":          { primary: "#D32F2F", secondary: "#FFD700", text: "#FFFFFF" },
    "Kayserispor":       { primary: "#FFD700", secondary: "#D32F2F", text: "#000000" },
    "Fatih Karagümrük":  { primary: "#7B2D26", secondary: "#1A1A1A", text: "#FFFFFF" }
  },

  // ─────────────── BÖLGE TANIMLARI ───────────────
  zones: {
    champions:       { label: "Şampiyon",              color: "#FFD700", range: "1. sıra" },
    championsLeague: { label: "Şampiyonlar Ligi",      color: "#1E88E5", range: "2-3. sıra" },
    europaLeague:    { label: "UEFA Avrupa Ligi",       color: "#FF9800", range: "4. sıra" },
    conference:      { label: "Konferans Ligi",         color: "#66BB6A", range: "5. sıra" },
    safe:            { label: "Güvenli Bölge",          color: "#78909C", range: "6-12. sıra" },
    danger:          { label: "Tehlike Bölgesi",        color: "#EF6C00", range: "13-15. sıra" },
    relegation:      { label: "Küme Düşme",             color: "#E53935", range: "16-18. sıra" }
  },

  // ─────────────── ANALİZ METRİKLERİ ───────────────
  // Hazır hesaplanmış istatistikler
  analytics: {
    // Lig ortalamaları
    leagueAvg: {
      xGPer90: 1.22,
      goalsPerMatch: 2.78,
      homeWinRate: 0.44,
      drawRate: 0.26,
      awayWinRate: 0.30
    },

    // En iyi hücum (xG bazlı)
    topAttack: [
      { team: "Galatasaray",  metric: "xG",  value: 50.11 },
      { team: "Fenerbahçe",   metric: "xG",  value: 47.78 },
      { team: "Beşiktaş",     metric: "xG",  value: 44.31 },
      { team: "Trabzonspor",  metric: "xG",  value: 40.13 },
      { team: "Başakşehir",   metric: "xG",  value: 40.12 }
    ],

    // En iyi savunma (xGA bazlı - düşük = iyi)
    topDefense: [
      { team: "Fenerbahçe",   metric: "xGA", value: 21.66 },
      { team: "Göztepe",      metric: "xGA", value: 24.8  },
      { team: "Samsunspor",   metric: "xGA", value: 25.1  },
      { team: "Galatasaray",  metric: "xGA", value: 26.1  },
      { team: "Beşiktaş",     metric: "xGA", value: 26.7  }
    ],

    // En büyük overperformer'lar (Gerçek gol - xG)
    overperformers: [
      { team: "Trabzonspor",  diff: 10.87, actual: 51, expected: 40.13 },
      { team: "Fenerbahçe",   diff: 9.22,  actual: 57, expected: 47.78 },
      { team: "Galatasaray",  diff: 8.89,  actual: 59, expected: 50.11 },
      { team: "Antalyaspor",  diff: 5.49,  actual: 24, expected: 18.51 },
      { team: "Başakşehir",   diff: 3.88,  actual: 44, expected: 40.12 }
    ],

    // En büyük underperformer'lar
    underperformers: [
      { team: "Eyüpspor",     diff: -8.41, actual: 19, expected: 27.41 },
      { team: "Kayserispor",  diff: -8.29, actual: 19, expected: 27.29 },
      { team: "Samsunspor",   diff: -5.97, actual: 27, expected: 32.97 },
      { team: "Konyaspor",    diff: -4.90, actual: 28, expected: 32.90 },
      { team: "Göztepe",      diff: -4.33, actual: 28, expected: 32.33 }
    ],

    // Piyasa değeri / puan oranı (value for money)
    valueForMoney: [
      { team: "Trabzonspor",    pointsPerMil: 0.498, points: 57, valueMil: 114.50 },
      { team: "Göztepe",        pointsPerMil: 0.753, points: 43, valueMil: 57.13  },
      { team: "Kocaelispor",    pointsPerMil: 1.294, points: 33, valueMil: 25.50  },
      { team: "Samsunspor",     pointsPerMil: 0.669, points: 35, valueMil: 52.35  },
      { team: "Gençlerbirliği", pointsPerMil: 0.917, points: 25, valueMil: 27.25  }
    ]
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPER_LIG_DATA;
}
