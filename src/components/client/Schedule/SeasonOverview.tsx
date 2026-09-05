"use client";

import React, { useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Collapse,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { ExpandMoreRounded } from "@mui/icons-material";
import { format } from "date-fns";

import { HtmlTooltip } from "@/components/ui/HtmlTooltip";
import SeasonSwitcher from "../Widgets/SeasonSwitcher";
import { formatSeason, isArchivedSeason } from "@/lib/config/season";
import {
  getResultColor,
  type SeasonRecord,
  type SeasonSummary,
} from "@/lib/utils/football-logic";

interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

interface GameResult {
  fixture: { id: number; date: string; timestamp: number };
  teams: { home: FixtureTeam; away: FixtureTeam };
  goals: { home: number; away: number };
  result: "W" | "D" | "L";
}

interface SeasonOverviewProps {
  summary: SeasonSummary;
  played: GameResult[];
  season: string;
}

const RESULT_WORD: Record<"W" | "D" | "L", string> = {
  W: "Won",
  D: "Drew",
  L: "Lost",
};

const DOT = 10;

/** Ties the toggle to the region it opens for assistive tech. */
const SPLIT_ID = "season-competition-split";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** The season in one card: the goals, the competitions, and the run. */
export default function SeasonOverview({
  summary,
  played,
  season,
}: SeasonOverviewProps) {
  const theme = useTheme();

  // Collapsed on both the server and the first client render, so the split
  // costs no height until it is asked for and there is nothing to mismatch.
  const [open, setOpen] = useState(false);

  const archived = isArchivedSeason(season);
  const latestId = played.length ? played[played.length - 1].fixture.id : null;
  const diff = summary.gf - summary.ga;

  // One competition means the split would just restate the total row.
  const showSplit = summary.competitions.length > 1;

  return (
    <Box sx={{ flexShrink: 0, zIndex: 10, pb: 2 }}>
      <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2.5 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "text.secondary",
              opacity: 0.5,
              letterSpacing: 1,
            }}
          >
            SEASON OVERVIEW
          </Typography>
          <SeasonSwitcher season={season} />
        </Stack>

        {archived && (
          <Chip
            label={`${formatSeason(season)} archive — read only`}
            size="small"
            sx={{
              mb: 2.5,
              fontWeight: 700,
              fontSize: "0.65rem",
              bgcolor: "background.default",
              color: "text.secondary",
            }}
          />
        )}

        {/* The headline and the competition split sit side by side once there
            is room. Stacked, they left the right half of a desktop-width card
            empty and pushed the fixture list a screenful down. */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2.5, md: 4 }}
          alignItems={{ xs: "stretch", md: "flex-start" }}
          sx={{ mb: 3 }}
        >
          {/* --- THE HEADLINE ---
              Goal difference, not a points total. Every competition the club
              played is in this list, so 3-1-0 across it would add a cup second
              round to a title race and present the sum as a league position.
              Goals are what survives the aggregation. */}
          <Box sx={{ flexShrink: 0, minWidth: { md: 132 } }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.5rem", sm: "2.75rem" },
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                color:
                  diff > 0
                    ? theme.palette.success.main
                    : diff < 0
                      ? theme.palette.error.main
                      : "text.primary",
              }}
            >
              {signed(diff)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.75,
                fontWeight: 800,
                letterSpacing: 1,
                color: "text.secondary",
                opacity: 0.55,
              }}
            >
              GOAL DIFF
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                fontWeight: 700,
                fontSize: "0.68rem",
                color: "text.secondary",
                opacity: 0.55,
              }}
            >
              {summary.gf} scored, {summary.ga} let in
            </Typography>
          </Box>

          {/* --- THE RECORD, WHOLE AND SPLIT ---
              Capped, because these rows are a label on the left and figures on
              the right: given a full desktop card they end up half a screen
              apart and you lose the row tracking across. */}
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: { md: 560 } }}>
            {showSplit ? (
              <ButtonBase
                onClick={() => setOpen((wasOpen) => !wasOpen)}
                aria-expanded={open}
                aria-controls={SPLIT_ID}
                sx={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  borderRadius: "8px",
                  px: 0.75,
                  py: 0.5,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <RecordRow
                  label="All competitions"
                  record={summary}
                  emphasis
                  expandable
                  expanded={open}
                />
              </ButtonBase>
            ) : (
              <Box sx={{ px: 0.75, py: 0.5 }}>
                <RecordRow label="This season" record={summary} emphasis />
              </Box>
            )}

            {showSplit && (
              <Collapse in={open} id={SPLIT_ID}>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.85} sx={{ px: 0.75, pb: 0.5 }}>
                  {summary.competitions.map((comp) => (
                    <RecordRow
                      key={comp.name}
                      label={comp.name}
                      logo={comp.logo}
                      record={comp}
                    />
                  ))}
                </Stack>
              </Collapse>
            )}
          </Box>
        </Stack>

        {/* --- FORM --- */}
        <Box>
          <Stack
            direction="row"
            alignItems="baseline"
            spacing={1.25}
            sx={{ mb: 1.25 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: "text.secondary",
                opacity: 0.5,
                letterSpacing: 1,
              }}
            >
              FORM
            </Typography>
            {played.length > 1 && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "text.secondary",
                  opacity: 0.4,
                }}
              >
                oldest → latest
              </Typography>
            )}
          </Stack>

          {played.length === 0 ? (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", opacity: 0.6 }}
            >
              No matches played yet this season.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "7px",
              }}
            >
              {played.map((game) => {
                const color = getResultColor(game.result, theme);
                const latest = game.fixture.id === latestId;
                const score = `${game.teams.home.name} ${game.goals.home}–${game.goals.away} ${game.teams.away.name}`;

                return (
                  <HtmlTooltip
                    key={game.fixture.id}
                    arrow
                    title={
                      <Box sx={{ p: 0.25 }}>
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            fontWeight: 900,
                            letterSpacing: 0.6,
                            color,
                          }}
                        >
                          {RESULT_WORD[game.result].toUpperCase()}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight={800}
                          sx={{ mt: 0.25 }}
                        >
                          {score}
                        </Typography>
                        {game.fixture.date && (
                          <Typography variant="caption" sx={{ opacity: 0.65 }}>
                            {format(new Date(game.fixture.date), "d MMM yyyy")}
                          </Typography>
                        )}
                      </Box>
                    }
                  >
                    {/* Deliberately not a motion.div. A staggered entrance
                          ships every dot from the server at opacity 0, which
                          leaves a whole season's form invisible until
                          hydration lands — a bad trade for a fade nobody
                          asked for. Hover is plain CSS for the same reason. */}
                    <Box
                      // A bare div's aria-label is ignored by most screen
                      // readers; role="img" is what makes the dot announce as
                      // the result it stands for.
                      role="img"
                      aria-label={`${RESULT_WORD[game.result]} — ${score}`}
                      sx={{
                        width: DOT,
                        height: DOT,
                        flexShrink: 0,
                        borderRadius: "50%",
                        bgcolor: color,
                        cursor: "pointer",
                        // A halo on the most recent result, so the live end of
                        // the run is findable without counting from the left.
                        boxShadow: latest
                          ? `0 0 0 2.5px ${alpha(color, 0.3)}`
                          : "none",
                        transition: "transform 0.15s ease",
                        "&:hover": { transform: "scale(1.4)" },
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: "none",
                        },
                      }}
                    />
                  </HtmlTooltip>
                );
              })}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

/**
 * One competition's line: who it was, and the W/D/L that came out of it.
 *
 * The overall row reuses this so the total and the split cannot drift into
 * two different shapes on the same card.
 */
function RecordRow({
  label,
  record,
  logo,
  emphasis = false,
  expandable = false,
  expanded = false,
}: {
  label: string;
  record: SeasonRecord;
  logo?: string;
  emphasis?: boolean;
  /** Draws the disclosure chevron. The row itself is not the button. */
  expandable?: boolean;
  expanded?: boolean;
}) {
  const theme = useTheme();
  const tally = [
    { key: "W" as const, count: record.w },
    { key: "D" as const, count: record.d },
    { key: "L" as const, count: record.l },
  ];

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ minWidth: 0 }}
      >
        {logo && (
          <Box
            component="img"
            loading="lazy"
            decoding="async"
            src={logo}
            alt=""
            sx={{ width: 14, height: 14, objectFit: "contain", opacity: 0.7 }}
            onError={(e: any) => {
              e.target.style.display = "none";
            }}
          />
        )}
        <Typography
          noWrap
          sx={{
            fontSize: emphasis ? "0.78rem" : "0.75rem",
            fontWeight: emphasis ? 800 : 700,
            color: emphasis ? "text.primary" : "text.secondary",
          }}
        >
          {label}
        </Typography>
        {expandable && (
          <ExpandMoreRounded
            sx={{
              fontSize: 18,
              opacity: 0.5,
              flexShrink: 0,
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "none",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            }}
          />
        )}
      </Stack>

      <Stack
        direction="row"
        spacing={0.9}
        alignItems="baseline"
        sx={{ flexShrink: 0 }}
      >
        {tally.map(({ key, count }, i) => (
          <React.Fragment key={key}>
            {i > 0 && (
              <Typography sx={{ opacity: 0.25, fontSize: "0.7rem" }}>
                ·
              </Typography>
            )}
            <Stack direction="row" spacing={0.35} alignItems="baseline">
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: emphasis ? "1.05rem" : "0.85rem",
                  lineHeight: 1,
                  color: getResultColor(key, theme),
                }}
              >
                {count}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: emphasis ? "0.68rem" : "0.6rem",
                  color: "text.secondary",
                  opacity: 0.7,
                }}
              >
                {key}
              </Typography>
            </Stack>
          </React.Fragment>
        ))}
      </Stack>
    </Stack>
  );
}
