import React from "react";
import { useSelector } from "react-redux";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { selectSquadDataObject } from "../../Selectors/squadDataSelectors";

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

export default function PlayersSelect({ onChange, showAvatar = true }) {
  const squadData = useSelector(selectSquadDataObject);

  // All players in an array, sorted for grouping
  const allPlayers = Object.values(squadData).sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.position);
    const posB = POSITION_ORDER.indexOf(b.position);
    if (posA !== posB) return posA - posB;
    return a.name.localeCompare(b.name);
  });

  const [selectedPlayer, setSelectedPlayer] = React.useState(null);

  const handleChange = (_, value) => {
    setSelectedPlayer(value);
    if (onChange && value) {
      // Simulate event structure for compatibility
      onChange({ target: { value: value.id } });
    }
  };

  return (
    <Autocomplete
      value={selectedPlayer}
      disableClearable
      onChange={handleChange}
      options={allPlayers}
      groupBy={(player) => player.position}
      getOptionLabel={(player) => player?.name || ""}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderOption={(props, player) => (
        <Box
          component="li"
          {...props}
          key={player.id}
          display="flex"
          alignItems="center"
          gap={1}
        >
          {showAvatar && (
            <Avatar
              alt={player.name}
              src={player.photo}
              sx={{ height: 50, width: 50, borderRadius: 1 }}
            />
          )}
          <Typography>{player.name}</Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label="Choose A Player" variant="standard" />
      )}
      sx={{ minWidth: 240 }}
    />
  );
}
