export const API_TOKEN = "8V5537joh73fQ743jFl0miN6F9OsS7kaSQg43ftg4pKw5IMKLmV4tu2I8Oii";
export const BASE_URL = "https://api.sportmonks.com/v3";

export const LEAGUES = [
  { id: 8, name: "Premier League", country: "England", code: "EPL" },
  { id: 564, name: "La Liga", country: "Spain", code: "ESP" },
  { id: 82, name: "Bundesliga", country: "Germany", code: "GER" },
  { id: 384, name: "Serie A", country: "Italy", code: "ITA" },
  { id: 301, name: "Ligue 1", country: "France", code: "FRA" },
  { id: 600, name: "Süper Lig", country: "Turkey", code: "TUR" },
];

export const LEAGUE_IDS = LEAGUES.map(l => l.id).join(',');
