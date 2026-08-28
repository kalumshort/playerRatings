export interface Fixture {
  id: string;
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    // `elapsed` is the live minute; only present while the match is in play.
    status: { short: string; long: string; elapsed?: number | null };
    venue?: { name?: string; city?: string };
  };
  /**
   * Present on every stored fixture and used throughout the schedule (filter
   * options, row context line), but it was missing from this interface — which
   * is part of why the Schedule components all fell back to `any`.
   */
  league?: {
    id?: number;
    name: string;
    logo?: string;
    /** Arrives as "Regular Season - 3"; see formatRound in fixtureDisplay.ts. */
    round?: string;
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
