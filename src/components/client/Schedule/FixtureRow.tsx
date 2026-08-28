"use client";

import React, { useMemo } from "react";
import { keyframes } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

import { Fixture } from "@/types/football";
import { getResultColor } from "@/lib/utils/football-logic";
import { formatKickoff, relativeKickoff } from "@/lib/utils/date-format";
import useMounted from "@/Hooks/useMounted";
import {
  getClubSide,
  getFixtureContext,
  getFixtureStatus,
  getMatchId,
  getResult,
} from "./fixtureDisplay";

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.6; }
`;

export interface FixtureUserStatus {
  rated?: boolean;
  predicted?: boolean;
}

interface FixtureRowProps {
  fixture: Fixture;
  clubId: number;
  onSelect: (matchId: string) => void;
  highlight?: boolean;
  /**
   * The signed-in user's progress on this match. Undefined for guests and
   * during SSR, in which case no badge renders at all — so the server HTML
   * matches the first client render.
   */
  status?: FixtureUserStatus;
}

function FixtureRow({
  fixture,
  clubId,
  onSelect,
  highlight = false,
  status,
}: FixtureRowProps) {
  // Relative time reads the clock, so it can only render after hydration.
  const mounted = useMounted();

  const state = getFixtureStatus(fixture);
  const isPending = state === "prematch";
  const isLive = state === "inplay";
  const isFinished = state === "postmatch";
  const isCancelled = state === "cancelled";

  const side = getClubSide(fixture, clubId);
  const result = useMemo(
    () => getResult(fixture, clubId),
    [fixture, clubId],
  );
  const context = useMemo(() => getFixtureContext(fixture), [fixture]);

  const { dayMonth, time } = useMemo(
    () => formatKickoff(fixture.fixture.timestamp),
    [fixture.fixture.timestamp],
  );
  const relative = mounted ? relativeKickoff(fixture.fixture.timestamp) : null;

  // "Rate" after the whistle, "Predict" before it. Nothing while in play, and
  // nothing at all for a fixture the user can't act on.
  const action = useMemo(() => {
    if (!status) return null;
    if (isFinished) {
      return status.rated
        ? { label: "Rated", done: true }
        : { label: "Rate", done: false };
    }
    if (isPending) {
      return status.predicted
        ? { label: "Predicted", done: true }
        : { label: "Predict", done: false };
    }
    return null;
  }, [status, isFinished, isPending]);

  const homeIsClub = fixture.teams.home.id === clubId;

  return (
    <Box
      // A real button so the row is reachable by keyboard and announced as
      // interactive; it was a bare div with an onClick.
      component="button"
      type="button"
      onClick={() => onSelect(getMatchId(fixture))}
      aria-label={`View ${fixture.teams.home.name} versus ${fixture.teams.away.name}`}
      sx={(t) => ({
        ...t.clay.card,
        // Undo the UA button styling so the card looks unchanged.
        display: "block",
        width: "100%",
        textAlign: "left",
        font: "inherit",
        color: "inherit",
        border: 0,
        p: 0,
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
        ...(highlight && {
          outline: `2px solid ${t.palette.primary.main}`,
          outlineOffset: "2px",
        }),
        "&:hover": { transform: "translateY(-2px)" },
        "&:active": { transform: "scale(0.98)" },
        "&:focus-visible": {
          outline: `2px solid ${t.palette.primary.main}`,
          outlineOffset: "2px",
        },
      })}
    >
      {/* Meta row: home/away + date on the left, status/action on the right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 2,
          pt: 1.5,
          pb: 0.75,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            minWidth: 0,
          }}
        >
          {side && (
            <Box
              component="span"
              aria-label={side === "H" ? "Home fixture" : "Away fixture"}
              sx={(t) => ({
                ...t.clay.box,
                fontSize: "0.58rem",
                fontWeight: 900,
                lineHeight: 1,
                px: 0.7,
                py: 0.4,
                borderRadius: "6px",
                color: "text.secondary",
                flexShrink: 0,
              })}
            >
              {side}
            </Box>
          )}
          <Typography
            // date-fns formats in the runtime's timezone, so the server (UTC)
            // and a non-UTC client can legitimately differ.
            suppressHydrationWarning
            sx={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "text.secondary",
              opacity: 0.65,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {dayMonth}
            {relative && ` · ${relative}`}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexShrink: 0,
          }}
        >
          {isLive && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                  animation: `${pulse} 1.5s ease-in-out infinite`,
                }}
              />
              <Typography
                sx={{ fontSize: "0.6rem", fontWeight: 900, color: "error.main" }}
              >
                {fixture.fixture.status.elapsed}&apos;
              </Typography>
            </Box>
          )}

          {result && (
            <Typography
              sx={(t) => {
                const color = getResultColor(result, t);
                return {
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  color,
                  bgcolor: `${color}22`,
                  px: 0.9,
                  py: 0.3,
                  borderRadius: "6px",
                  letterSpacing: 0.5,
                };
              }}
            >
              {result}
            </Typography>
          )}

          {action && (
            <Typography
              sx={(t) => ({
                fontSize: "0.6rem",
                fontWeight: 800,
                letterSpacing: 0.3,
                px: 0.9,
                py: 0.3,
                borderRadius: "6px",
                ...(action.done
                  ? {
                      color: "text.secondary",
                      opacity: 0.6,
                      bgcolor: "transparent",
                    }
                  : {
                      color: t.palette.primary.main,
                      bgcolor: `${t.palette.primary.main}1f`,
                    }),
              })}
            >
              {action.done ? `${action.label} ✓` : action.label}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Main row: home | score/time | away */}
      <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 1 }}>
        <TeamSide
          team={fixture.teams.home}
          isClub={homeIsClub}
          align="start"
        />

        <Box
          sx={(t) => ({
            ...t.clay.box,
            flexShrink: 0,
            textAlign: "center",
            minWidth: 72,
            px: 1.5,
            py: 1,
            borderRadius: "14px",
          })}
        >
          {isPending || isCancelled ? (
            <Typography
              suppressHydrationWarning
              sx={{
                fontWeight: 900,
                fontSize: "1rem",
                color: "text.secondary",
                lineHeight: 1,
              }}
            >
              {/* A postponed match has no kickoff time worth showing — it used
                  to render the original one as if it were still on. */}
              {isCancelled ? "–" : time}
            </Typography>
          ) : (
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "1.1rem",
                color: isLive ? "primary.main" : "text.primary",
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              {fixture.goals.home} – {fixture.goals.away}
            </Typography>
          )}
          {(isFinished || isCancelled) && (
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "text.secondary",
                opacity: 0.45,
                letterSpacing: 1,
                mt: 0.5,
              }}
            >
              {isCancelled
                ? fixture.fixture.status.short
                : "FULL TIME"}
            </Typography>
          )}
        </Box>

        <TeamSide
          team={fixture.teams.away}
          isClub={!homeIsClub}
          align="end"
        />
      </Box>

      {/* Context row: competition, round, venue */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 2,
          pt: 1,
          pb: 1.5,
          minWidth: 0,
        }}
      >
        {fixture.league?.logo && (
          <Box
            component="img"
            loading="lazy"
            decoding="async"
            src={fixture.league.logo}
            alt=""
            sx={{
              width: 12,
              height: 12,
              objectFit: "contain",
              opacity: 0.65,
              flexShrink: 0,
            }}
          />
        )}
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: "text.secondary",
            opacity: 0.55,
            letterSpacing: 0.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {[fixture.league?.name, context].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * One side of the tie. The club's own name is heavier and fully opaque so you
 * can tell at a glance which team is yours — the old row gave no such cue, and
 * the ordering stays home-then-away so the scoreline is never misread.
 */
function TeamSide({
  team,
  isClub,
  align,
}: {
  team: Fixture["teams"]["home"];
  isClub: boolean;
  align: "start" | "end";
}) {
  const logo = (
    <Box
      component="img"
      loading="lazy"
      decoding="async"
      src={team.logo}
      alt={team.name}
      sx={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }}
    />
  );

  const name = (
    <Typography
      sx={{
        fontWeight: isClub ? 900 : 700,
        opacity: isClub ? 1 : 0.75,
        fontSize: "0.85rem",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align === "end" ? "right" : "left",
      }}
    >
      {team.name}
    </Typography>
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flex: 1,
        minWidth: 0,
        justifyContent: align === "end" ? "flex-end" : "flex-start",
      }}
    >
      {align === "start" ? (
        <>
          {logo}
          {name}
        </>
      ) : (
        <>
          {name}
          {logo}
        </>
      )}
    </Box>
  );
}

// ~50 rows on the schedule. Props are a per-row fixture object, a
// useCallback'd handler, and two primitives, so shallow compare works. The
// `status` object comes from a memoized map, so its reference is stable too.
export default React.memo(FixtureRow);
