/**
 * Sportmonks V3 Types (Partial)
 */

export interface Fixture {
  id: number;
  starting_at: string;
  result_info: string;
  participants: Participant[];
  scores: Score[];
  xgfixture?: Stat[];
  statistics?: Stat[];
  round?: {
    name: string;
  };
  league?: {
    name: string;
    image_path: string;
  };
}

export interface Participant {
  id: number;
  name: string;
  image_path: string;
  meta: {
    location: 'home' | 'away';
  };
}

export interface Score {
  description: string;
  score: {
    goals: number;
    participant_id: number;
  };
}

export interface Stat {
  type_id: number;
  participant_id: number;
  data: {
    value: number | string;
  };
}
