import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  useTheme,
  alpha,
  IconButton,
  Stack,
} from "@mui/material";
import { Close, KeyboardArrowDown } from "@mui/icons-material";
import { selectSquadDataObject } from "../../Selectors/squadDataSelectors";

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

export default function PlayersSelect({ onChange, showAvatar = true }) {
  const theme = useTheme();
  const squadData = useSelector(selectSquadDataObject);
  const [open, setOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Group players by position
  const playersByPosition = POSITION_ORDER.reduce((acc, pos) => {
    acc[pos] = Object.values(squadData)
      .filter((p) => p.position === pos)
      .sort((a, b) => a.name.localeCompare(b.name));
    return acc;
  }, {});

  const selectedPlayer = squadData[selectedPlayerId];

  const handleSelect = (player) => {
    setSelectedPlayerId(player.id);
    setOpen(false);
    if (onChange) {
      onChange({ target: { value: player.id } });
    }
  };

  return (
    <>
      {/* The Trigger Button - Glassified */}
      <Button
        fullWidth
        onClick={() => setOpen(true)}
        endIcon={<KeyboardArrowDown />}
        sx={{
          py: 1.5,
          px: 2,
          justifyContent: "space-between",
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: "blur(10px)",
          borderRadius: 3,
          color: selectedPlayer ? "text.primary" : "text.secondary",
          "&:hover": {
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {selectedPlayer ? (
            <>
              <Avatar
                src={selectedPlayer.photo}
                sx={{ width: 24, height: 24 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {selectedPlayer.name}
              </Typography>
            </>
          ) : (
            <Typography variant="body2">Choose A Player...</Typography>
          )}
        </Stack>
      </Button>

      {/* Mobile-First Selection Dialog */}
      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: alpha(theme.palette.background.default, 0.9),
            backdropFilter: "blur(20px)",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            SQUAD LIST
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <List sx={{ pb: 10 }}>
            {POSITION_ORDER.map((pos) => (
              <React.Fragment key={pos}>
                <ListSubheader
                  sx={{
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    backdropFilter: "blur(10px)",
                    fontWeight: 900,
                    color: "primary.main",
                    fontSize: "0.7rem",
                    letterSpacing: 2,
                    py: 1,
                    lineHeight: "1.5rem",
                  }}
                >
                  {pos.toUpperCase()}S
                </ListSubheader>
                {playersByPosition[pos].map((player) => (
                  <ListItemButton
                    key={player.id}
                    onClick={() => handleSelect(player)}
                    sx={{
                      py: 1.5,
                      borderBottom: `1px solid ${alpha(
                        theme.palette.divider,
                        0.05
                      )}`,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={player.photo}
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "background.paper",
                          border: `1px solid ${alpha(
                            theme.palette.divider,
                            0.1
                          )}`,
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={player.name}
                      primaryTypographyProps={{ fontWeight: 700 }}
                      secondary={player.number ? `#${player.number}` : null}
                    />
                  </ListItemButton>
                ))}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
}
