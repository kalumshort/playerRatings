/**
 * FORMATIONS CONFIG
 *
 * Rows are ordered attack-first (the pitch renders top-down, GK at the bottom).
 * Horizontal position within a row is implicit from array order — rows are laid
 * out with `justify-content: space-evenly`.
 *
 * Every formation is a permutation of slot IDs 1-11, so switching formation
 * never drops a pick. It does, however, change what a slot *means*: slot 7 is
 * the right winger in "4-3-3 Holding" and a left centre-back in "3-5-2". That's
 * why the picker derives its default position from `rowId` (see
 * POSITION_BY_ROW) rather than from the slot number.
 */

export type FormationRowId = "gk" | "def" | "dm" | "mid" | "am" | "atk" | "f9";

export type SquadPosition =
  | "Goalkeeper"
  | "Defender"
  | "Midfielder"
  | "Attacker";

export interface FormationRow {
  rowId: FormationRowId;
  slots: number[];
}

export const DEFAULT_FORMATION = "4-3-3 Holding";

/**
 * Which squad position the picker should open on for a given pitch row.
 *
 * Deliberately lossy: a wing-back sits in the `mid` row of "3-5-2" but is
 * tagged `Defender` in the squad data. This only chooses the *default* tab —
 * the tabs stay switchable and search ignores position entirely.
 */
export const POSITION_BY_ROW: Record<FormationRowId, SquadPosition> = {
  gk: "Goalkeeper",
  def: "Defender",
  dm: "Midfielder",
  mid: "Midfielder",
  am: "Midfielder",
  atk: "Attacker",
  f9: "Attacker",
};

export const FORMATIONS: Record<string, FormationRow[]> = {
  // --- 4 AT THE BACK ---
  "4-3-3 Holding": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "mid", slots: [8, 10] }, // CM, CM
    { rowId: "dm", slots: [6] }, // CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-3 Attack": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "am", slots: [10] }, // CAM
    { rowId: "mid", slots: [8, 6] }, // CM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-3": [
    { rowId: "atk", slots: [11, 9, 10] }, // LW, ST, RW
    { rowId: "mid", slots: [8, 7, 6] }, // CM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-3 False 9": [
    { rowId: "atk", slots: [11, 7] }, // LW, RW
    { rowId: "f9", slots: [9] }, // CF (False 9) drops deep
    { rowId: "mid", slots: [8, 10, 6] }, // CM, CDM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-4-2 Flat": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "mid", slots: [10, 8, 6, 7] }, // LM, CM, CM, RM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-4-2 Diamond": [
    { rowId: "atk", slots: [11, 9] }, // LS, RS
    { rowId: "am", slots: [10] }, // CAM
    { rowId: "mid", slots: [8, 7] }, // LCM, RCM (Shuttlers)
    { rowId: "dm", slots: [6] }, // CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-2-3-1 Wide": [
    { rowId: "atk", slots: [9] },
    { rowId: "am", slots: [11, 10, 7] }, // LM, CAM, RM
    { rowId: "dm", slots: [8, 6] }, // CDM, CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-2-3-1 Narrow": [
    { rowId: "atk", slots: [9] },
    { rowId: "am", slots: [10, 8, 6] }, // LAM, CAM, RAM (Compact)
    { rowId: "dm", slots: [7, 11] }, // CDM, CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-1-4-1": [
    { rowId: "atk", slots: [9] },
    { rowId: "mid", slots: [11, 10, 8, 7] }, // LM, CM, CM, RM
    { rowId: "dm", slots: [6] }, // CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-5-1": [
    { rowId: "atk", slots: [9] },
    { rowId: "mid", slots: [11, 10, 6, 8, 7] }, // Flat 5 Midfield
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-2-1 (Xmas Tree)": [
    { rowId: "atk", slots: [9] }, // ST
    { rowId: "am", slots: [11, 10] }, // LAM, RAM (Tucked in)
    { rowId: "mid", slots: [8, 6, 7] }, // CM, CM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],

  // --- 3 AT THE BACK ---
  "3-5-2": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "mid", slots: [5, 10, 8, 6, 2] }, // LWB, CM, CM, CM, RWB
    { rowId: "def", slots: [7, 4, 3] }, // 7 drops to LCB
    { rowId: "gk", slots: [1] },
  ],
  "3-4-3 Wide": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "mid", slots: [5, 10, 8, 2] }, // LM, CM, CM, RM
    { rowId: "def", slots: [6, 4, 3] }, // LCB, CB, RCB
    { rowId: "gk", slots: [1] },
  ],
  "3-4-3 Diamond": [
    { rowId: "atk", slots: [9] },
    { rowId: "am", slots: [11, 7] }, // LF, RF (Inside Forwards)
    { rowId: "mid", slots: [5, 10, 8, 2] }, // LM, CM, CM, RM
    { rowId: "def", slots: [6, 4, 3] },
    { rowId: "gk", slots: [1] },
  ],
  "3-4-1-2": [
    { rowId: "atk", slots: [11, 9] }, // ST, ST
    { rowId: "am", slots: [10] }, // CAM
    { rowId: "mid", slots: [5, 8, 6, 2] }, // LM, CM, CM, RM
    { rowId: "def", slots: [7, 4, 3] },
    { rowId: "gk", slots: [1] },
  ],

  // --- 5 AT THE BACK ---
  "5-3-2": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "mid", slots: [10, 8, 6] }, // 3 CMs
    { rowId: "def", slots: [5, 7, 4, 3, 2] }, // 5 Defenders
    { rowId: "gk", slots: [1] },
  ],
  "5-2-1-2": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "am", slots: [10] },
    { rowId: "mid", slots: [8, 6] },
    { rowId: "def", slots: [5, 7, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "5-2-3": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "mid", slots: [10, 8] }, // 2 CMs
    { rowId: "def", slots: [5, 6, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "5-4-1": [
    { rowId: "atk", slots: [9] },
    { rowId: "mid", slots: [11, 10, 8, 7] }, // Flat 4
    { rowId: "def", slots: [5, 6, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
};
