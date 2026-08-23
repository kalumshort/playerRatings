import { PREDICTION, PREDICTION_CAPS } from "./xpConfig";

/**
 * Prediction points for one match — the display-side mirror.
 *
 * NOTE: functions/gamification/predictionPoints.js is the authoritative copy;
 * this one only feeds the match card. `src/` and `functions/` are separate
 * packages and cannot import each other. Change one, change the other.
 */

const FINISHED = ["FT", "AET", "PEN"];

export interface PointsLine {
  key: string;
  label: string;
  earned: number;
  available: number;
}

export interface PredictionPointsResult {
  points: number;
  lines: PointsLine[];
  /** False when the match has no settled result to score against yet. */
  resolved: boolean;
}

const outcomeOf = (goals: any): string | null => {
  const home = Number(goals?.home);
  const away = Number(goals?.away);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
};

/** Reads `startXI`, never a substitution-adjusted list. */
const actualStartingXI = (fixture: any, clubId: string | number): string[] => {
  const team = (fixture?.lineups || []).find(
    (entry: any) => Number(entry?.team?.id) === Number(clubId),
  );
  return (team?.startXI || [])
    .map((entry: any) => entry?.player?.id)
    .filter((id: any) => id != null)
    .map(String);
};

/** Own goals excluded — that is not the involvement anyone predicted. */
const scoredOrAssisted = (fixture: any, playerId: string): boolean => {
  const target = String(playerId);
  return (fixture?.events || []).some((event: any) => {
    if (event?.type !== "Goal") return false;
    if (String(event?.detail || "").toLowerCase().includes("own goal")) {
      return false;
    }
    return (
      String(event?.player?.id) === target ||
      String(event?.assist?.id) === target
    );
  });
};

/**
 * Scores a fan's predictions against the finished match.
 *
 * A shootout counts as the draw it was after 120 minutes: `goals` excludes
 * penalties, which is the only reading under which "predict the score" has a
 * sane answer.
 */
export function computePredictionPoints(
  doc: any,
  fixture: any,
  clubId: string | number,
): PredictionPointsResult {
  const d = doc && typeof doc === "object" ? doc : {};
  const resolved = Boolean(fixture) && FINISHED.includes(fixture.status);
  const actualOutcome = resolved ? outcomeOf(fixture.goals) : null;

  const actualXI = resolved ? actualStartingXI(fixture, clubId) : [];
  const hasSheet = actualXI.length > 0;

  let hits = 0;
  if (hasSheet && d.chosenTeam) {
    const actualIds = new Set(actualXI);
    const predicted = new Set(
      Object.values(d.chosenTeam)
        .filter((id: any) => id != null && id !== "")
        .map(String),
    );
    predicted.forEach((id) => {
      if (actualIds.has(id)) hits++;
    });
    hits = Math.min(hits, PREDICTION_CAPS.xiHits);
  }

  const perfect =
    hits === PREDICTION_CAPS.xiHits && actualXI.length === PREDICTION_CAPS.xiHits;

  const lines: PointsLine[] = [
    {
      key: "correctResult",
      label: "Called the result",
      earned:
        actualOutcome && d.result === actualOutcome ? PREDICTION.correctResult : 0,
      available: PREDICTION.correctResult,
    },
    {
      key: "exactScore",
      label: "Exact scoreline",
      earned:
        resolved &&
        d.ScorePrediction &&
        String(d.ScorePrediction).trim() ===
          `${Number(fixture.goals.home)}-${Number(fixture.goals.away)}`
          ? PREDICTION.exactScore
          : 0,
      available: PREDICTION.exactScore,
    },
    {
      key: "xiHits",
      // The team sheet is what makes this scorable, and it is not always in
      // the feed — say so rather than showing a silent zero.
      label: hasSheet
        ? `Starters called (${hits}/${PREDICTION_CAPS.xiHits})`
        : "Starters called — no team sheet for this match",
      earned: hits * PREDICTION.xiHit,
      available: PREDICTION_CAPS.xiHits * PREDICTION.xiHit,
    },
    {
      key: "perfectXi",
      label: "Perfect XI",
      earned: perfect ? PREDICTION.perfectXi : 0,
      available: PREDICTION.perfectXi,
    },
    {
      key: "playerToWatchInvolved",
      label: "Player to watch scored or assisted",
      earned:
        resolved && d.preMatchMotm && scoredOrAssisted(fixture, d.preMatchMotm)
          ? PREDICTION.playerToWatchInvolved
          : 0,
      available: PREDICTION.playerToWatchInvolved,
    },
  ];

  return {
    points: lines.reduce((sum, l) => sum + l.earned, 0),
    lines,
    resolved,
  };
}
