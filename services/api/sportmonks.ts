import { getTurkeyDateStr } from '../timezone';

export const SPORTMONKS_API_KEY = 'nhoWv5x2CBygbHrb2Q9mITWUbDQj8msfrKr3wlTuNLNnHzy8DoXBX6PfMRHd';

// Popüler Lig ID'leri ve Sıralaması (Kullanıcı Talebi: TR, EN, ES, IT, DE, FR)
export const LEAGUE_HIERARCHY: Record<number, number> = {
  600: 1, // Süper Lig
  8:   2, // Premier League
  564: 3, // La Liga
  384: 4, // Serie A
  82:  5, // Bundesliga
  301: 6  // Ligue 1
};

export const POPULAR_LEAGUE_IDS = Object.keys(LEAGUE_HIERARCHY).map(Number);



export interface SMFixture {
  id: number;
  name: string;
  starting_at: string;
  starting_at_timestamp: number;
  league_id: number;
  league: {
    id: number;
    name: string;
    image_path: string;
  };
  participants: {
    id: number;
    name: string;
    image_path: string;
    meta: {
      location: 'home' | 'away';
    };
  }[];
  scores: {
    score: {
      goals: number;
      participant: 'home' | 'away';
    };
    description: string;
  }[];
  state?: {
    id: number;
    name: string;
    short_name: string;
  };
  periods?: {
    id: number;
    minutes: number;
    description: string;
    ticking?: boolean;
    type_id?: number;
    started?: number;
  }[];
}

export const fetchPopularMatches = async (date?: string): Promise<SMFixture[]> => {
  try {
    const targetDate = date || getTurkeyDateStr();

    const leagueFilter = POPULAR_LEAGUE_IDS.join(',');
    let allFixtures: SMFixture[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url =
        `https://api.sportmonks.com/v3/football/fixtures/date/${targetDate}` +
        `?api_token=${SPORTMONKS_API_KEY}` +
        `&include=league;participants;scores;state;periods` +
        `&timezone=Europe/Istanbul` +
        `&page=${page}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`PopularMatches Hatası: ${response.status} ${response.statusText}`);
        hasMore = false;
        break;
      }
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        allFixtures = allFixtures.concat(result.data as SMFixture[]);

        // Sayfalama kontrolü
        if (result.pagination && result.pagination.has_more) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    // Client-side güvenlik filtresi: yalnızca istenen ligler
    return allFixtures.filter(f => POPULAR_LEAGUE_IDS.includes(f.league_id));
  } catch (error) {
    console.error('SportMonks verisi çekilemedi:', error);
    return null as unknown as SMFixture[]; // Null dön ki hata olduğunu anlasın, listeyi silmesin
  }
};

export const fetchMatchDetails = async (id: number | string): Promise<any> => {
  if (!id) return null;
  try {
    const url = `https://api.sportmonks.com/v3/football/fixtures/${id}?api_token=${SPORTMONKS_API_KEY}&include=league;venue;participants;scores;state;periods;statistics.type;lineups.player;events.type;events.player;events.relatedPlayer;season;formations&timezone=Europe/Istanbul`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`MatchDetails Hatası: ${response.status} ${response.statusText}`);
      return null;
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('fetchMatchDetails network error:', error);
    return null;
  }
};

export const fetchLeagueStandings = async (leagueId: number): Promise<any[]> => {
  if (!leagueId) return [];
  try {
    const url = `https://api.sportmonks.com/v3/football/standings/live/leagues/${leagueId}?api_token=${SPORTMONKS_API_KEY}&include=participant;details.type`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Standings Hatası: ${response.status} ${response.statusText}`);
      return [];
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('fetchLeagueStandings network error:', error);
    return [];
  }
};
export const fetchSeasonStandings = async (seasonId: number): Promise<any[]> => {
  if (!seasonId) return [];
  try {
    const url = `https://api.sportmonks.com/v3/football/standings/seasons/${seasonId}?api_token=${SPORTMONKS_API_KEY}&include=participant;details.type`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Season Standings Hatası: ${response.status} ${response.statusText}`);
      return [];
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('fetchSeasonStandings network error:', error);
    return [];
  }
};

export const fetchH2H = async (t1: number, t2: number): Promise<any[]> => {
  if (!t1 || !t2) return [];
  try {
    const url = `https://api.sportmonks.com/v3/football/fixtures/head-to-head/${t1}/${t2}?api_token=${SPORTMONKS_API_KEY}&include=league;participants;scores;state&timezone=Europe/Istanbul`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`H2H Hatası: ${response.status} ${response.statusText}`);
      return [];
    }
    const result = await response.json();
    return (result.data || []).slice(0, 10);
  } catch (error) {
    console.error('fetchH2H network error:', error);
    return [];
  }
};
