// The club directory: the list of clubs the app offers, replacing the old
// hardcoded teamList. `config/clubDirectory` is a single public doc rebuilt
// nightly by the updateFixtures Cloud Function from the `groups` collection,
// so promoted clubs appear and relegated clubs drop out with no deploy.

export interface DirectoryClub {
  /** API-Football team id — also the groups/{id} doc id. */
  teamId: string;
  name: string;
  slug: string;
  logoUrl: string;
  /** "archived" = no longer in the league; frozen at lastActiveSeason. */
  status: "active" | "archived";
  lastActiveSeason: string | null;
}

export interface ClubDirectory {
  season: string;
  clubs: DirectoryClub[];
}

export const EMPTY_CLUB_DIRECTORY: ClubDirectory = { season: "", clubs: [] };

/** Clubs a user may join or transfer to — archived clubs are never offered. */
export const selectJoinableClubs = (directory: ClubDirectory | null) =>
  (directory?.clubs ?? []).filter((club) => club.status === "active");

/** Narrows an untrusted Firestore payload to the shape the UI renders. */
export function normaliseClubDirectory(data: unknown): ClubDirectory {
  const raw = data as Partial<ClubDirectory> | undefined;

  if (!raw || !Array.isArray(raw.clubs)) return EMPTY_CLUB_DIRECTORY;

  return {
    season: String(raw.season ?? ""),
    clubs: raw.clubs
      .filter((club) => club && club.teamId && club.slug)
      .map((club) => ({
        teamId: String(club.teamId),
        name: String(club.name ?? ""),
        slug: String(club.slug ?? ""),
        logoUrl:
          club.logoUrl ||
          `https://media.api-sports.io/football/teams/${club.teamId}.png`,
        status: club.status === "archived" ? "archived" : "active",
        lastActiveSeason: club.lastActiveSeason
          ? String(club.lastActiveSeason)
          : null,
      })),
  };
}
