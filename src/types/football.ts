export interface Fixture {
  id: string;
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: { short: string; long: string };
    venue: { name: string; city: string };
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
  lineups?: any[];
  events?: any[];
}
