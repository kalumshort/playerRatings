"use client";

import React, { useState, useMemo } from "react";
import {
  Typography,
  Avatar,
  Button,
  SwipeableDrawer,
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  alpha,
  Stack,
  styled,
} from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";

// --- STYLED COMPONENTS ---
const Puller = styled(Box)(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: alpha(theme.palette.text.secondary, 0.2),
  borderRadius: 3,
  position: "absolute",
  top: 8,
  left: "calc(50% - 15px)",
}));

const POSITION_ORDER = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Attacker",
] as const;

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  number?: number;
  age?: number;
}

interface PlayersSelectProps {
  // Now expecting the Map: { [id]: Player }
  playersMap: Record<string | number, Player>;
  onChange?: (event: { target: { value: string | number } }) => void;
}

export default function PlayersSelect({
  playersMap = {},
  onChange,
}: PlayersSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  // 1. Grouping Logic
  // Since we have a Map, we use Object.values() to get the array for filtering
  const playersByPosition = useMemo(() => {
    const allPlayers = Object.values(playersMap);

    return POSITION_ORDER.reduce(
      (acc, pos) => {
        acc[pos] = allPlayers
          .filter((p) => p.position === pos)
          .sort((a, b) => a.name.localeCompare(b.name));
        return acc;
      },
      {} as Record<string, Player[]>,
    );
  }, [playersMap]);

  // 2. Direct Lookup (No .find() needed!)
  const selectedPlayer = selectedId ? playersMap[selectedId] : null;

  const handleSelect = (player: Player) => {
    setSelectedId(player.id);
    setOpen(false);
    if (onChange) onChange({ target: { value: player.id } });
  };

  return (
    <>
      <Button
        fullWidth
        onClick={() => setOpen(true)}
        variant="outlined"
        endIcon={<KeyboardArrowDown />}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {selectedPlayer ? (
            <>
              <Avatar
                src={selectedPlayer.photo}
                sx={{ width: 28, height: 28 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {selectedPlayer.name}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Choose Player...
            </Typography>
          )}
        </Stack>
      </Button>

      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        disableBackdropTransition={false}
        disableDiscovery={true}
        PaperProps={{
          sx: {
            maxWidth: 400,
            mx: "auto",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "80vh",
          },
        }}
      >
        <Box sx={{ position: "relative", pt: 4, pb: 2 }}>
          <Puller />
          <Typography variant="h6" align="center">
            SQUAD SELECT
          </Typography>
        </Box>

        <Box sx={{ overflowY: "auto", px: 1, pb: 4 }}>
          <List>
            {POSITION_ORDER.map((pos) => {
              const posPlayers = playersByPosition[pos] || [];
              if (posPlayers.length === 0) return null;

              return (
                <React.Fragment key={pos}>
                  <ListSubheader>{pos.toUpperCase()}S</ListSubheader>
                  {posPlayers.map((player) => (
                    <ListItemButton
                      key={player.id}
                      onClick={() => handleSelect(player)}
                    >
                      <ListItemAvatar>
                        <Avatar src={player.photo} variant="rounded" />
                      </ListItemAvatar>
                      <ListItemText primary={player.name} />
                    </ListItemButton>
                  ))}
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
