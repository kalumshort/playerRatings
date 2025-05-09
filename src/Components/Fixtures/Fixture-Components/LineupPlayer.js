import React from "react";
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";
import { useSelector } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import { missingPlayerImg } from "../../../Hooks/Helper_Functions";

export default function LineupPlayer({
  player,
  fixture,
  className,
  onDelete,
  draggable,
  onDragStart,
  onDrop,
  percentage,
  showPlayerName = true,
}) {
  const playerData = useSelector(selectSquadPlayerById(player?.id));
  // Filter: Goals scored by the player
  const goals = fixture?.events.filter(
    (event) =>
      (event.type === "Goal" || event.detail === "Penalty") &&
      event.player?.id === player.id
  );

  // Filter: Assists for goals by the player
  // const assists = fixture?.events.filter(
  //   (event) => event.type === "Goal" && event.assist?.id === player.id
  // );

  // Filter: Cards received by the player
  const cards = fixture?.events.filter(
    (event) => event.type === "Card" && event.player?.id === player.id
  );

  // Filter: Substitutions involving the player (either as the assisted or substituted player)
  const substitution = fixture?.events.filter(
    (event) =>
      event.type === "subst" &&
      (event.player?.id === player.id || event.assist?.id === player.id)
  )[0];

  const yellowCards = cards?.filter(
    (card) => card.detail === "Yellow Card"
  ).length;
  const redCards = cards?.filter((card) => card.detail === "Red Card").length;
  // let cardIcon = null;
  let cardClassName = "";

  if (yellowCards === 2 && redCards === 1) {
    // cardIcon =
    //   "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-yellow-red.svg";
    cardClassName = "yellow-red-card"; // Example class name
  } else if (yellowCards === 1 && redCards === 0) {
    // cardIcon =
    //   "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-yellow.svg";
    cardClassName = "yellow-card"; // Example class name
  } else if (redCards === 1) {
    // cardIcon =
    //   "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-red.svg";
    cardClassName = "red-card"; // Example class name
  }

  return player ? (
    <div
      key={player.id}
      className={`player ${className} ${cardClassName}`}
      style={{ order: player?.grid?.split(":")[1] }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <img
        src={player?.photo || playerData?.photo || missingPlayerImg}
        className="lineup-player-img"
        alt={player.name}
      />
      {showPlayerName && (
        <span className="lineup-player-name">
          {playerData?.name || player.name}
        </span>
      )}
      <span className="lineup-player-number ">
        {playerData?.number || player.numbner}
      </span>
      <span className="lineup-player-goals">
        {goals?.map((goal, index) => (
          <Tooltip
            key={index}
            title={` ${goal.time.elapsed}'${
              goal.time.extra ? `+${goal.time.extra}` : ""
            }`}
            placement="top"
          >
            <img
              key={index}
              src={
                goal.detail === "Own Goal"
                  ? "https://img.icons8.com/?size=100&id=LDze7ETPiEDu&format=png&color=FA5252"
                  : "https://img.icons8.com/?size=100&id=cg5jSDHEKVtO&format=png&color=000000"
              }
              alt="Goal Icon"
              width={18}
              height={18}
              style={{ margin: "0px -1px" }}
            />
          </Tooltip>
        ))}
      </span>
      {/* <span className="lineup-player-cards">
        {cards?.length > 0 && (
          <Tooltip
            title={cards
              .map(
                (card) =>
                  `${card.detail} at ${card.time.elapsed}'${
                    card.time.extra ? `+${card.time.extra}` : ""
                  }`
              )
              .join(", ")}
            placement="top"
          >
            <img
              src={cardIcon}
              alt="Card Icon"
              height={20}
              style={{ margin: "0px -1px" }}
            />
          </Tooltip>
        )}
      </span> */}
      <span className="lineup-player-substitution">
        {substitution && (
          <Tooltip
            title={`Substituted in at ${substitution.time.elapsed}' from ${substitution.player.name} to ${substitution.assist.name}`}
            placement="top"
          >
            <img
              src="https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/sub-w.svg"
              height={20}
              alt={player.name}
              style={{ cursor: "pointer" }} // Optional, to indicate it's interactive
            />
          </Tooltip>
        )}
      </span>
      {onDelete && (
        <span className="player-lineup-delete">
          <DeleteIcon
            color="error"
            fontSize="small"
            onClick={() => onDelete(player.id)}
          />
        </span>
      )}
      {percentage && (
        <div className="percentage-bar-container">
          <div
            className="percentage-bar"
            style={{ width: `${percentage}%` }}
          ></div>
          <span className="percentage-text">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
}
