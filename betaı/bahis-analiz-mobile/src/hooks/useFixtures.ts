import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_TOKEN, BASE_URL, LEAGUE_IDS } from '../config/api';
import type { Fixture } from '../types/sportmonks';
import { format } from 'date-fns';

export const useFixtures = (date: Date) => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFixtures = async () => {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      try {
        const response = await axios.get(`${BASE_URL}/football/fixtures/date/${dateStr}`, {
          params: {
            api_token: API_TOKEN,
            filters: `fixtureLeagues:${LEAGUE_IDS}`,
            include: 'participants;scores;round;statistics;xgfixture;league',
          }
        });

        setFixtures(response.data.data || []);
        setError(null);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || 'Failed to fetch fixtures');
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();
    
    const interval = setInterval(fetchFixtures, 60000);
    return () => clearInterval(interval);
  }, [date]);

  return { fixtures, loading, error };
};
