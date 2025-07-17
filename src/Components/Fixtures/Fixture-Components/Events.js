import React, { useMemo, useState } from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { MenuItem, Select } from "@mui/material";

export default function Events({ events }) {
  const eventOptions = useMemo(() => {
    return [...new Set(events?.map((item) => item.type))];
  }, [events]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const handleChange = (event) => {
    setSelectedLeague(event.target.value);
  };
  const filteredFixures = selectedLeague
    ? events.filter((item) => item.type === selectedLeague)
    : events;

  if (!events) {
    return (
      <ContentContainer className="events-container containerMargin">
        <h2 className="heading2" style={{ textAlign: "center" }}>
          No Events
        </h2>
      </ContentContainer>
    );
  }
  return (
    <ContentContainer className="containerMargin">
      <div className="fixtures-list-header">
        <h2 className="globalHeading">Events</h2>
        <Select
          value={selectedLeague}
          onChange={handleChange}
          size="small"
          variant="standard"
          displayEmpty
          renderValue={(selected) => (selected ? selected : "All")}
        >
          <MenuItem key="" value="">
            All
          </MenuItem>
          {eventOptions.map((league) => (
            <MenuItem key={league} value={league}>
              {league}
            </MenuItem>
          ))}
        </Select>
      </div>
      <div className="events-container">
        {filteredFixures.map((event, index) => (
          <EventItem key={index} event={event} />
        ))}
      </div>
    </ContentContainer>
  );
}

const EventItem = ({ event }) => {
  const renderEventDetails = () => {
    switch (event.type) {
      case "Card":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Card</strong>: {event.detail}
              <div>
                <span
                  style={{
                    color:
                      event.detail === "Yellow Card" ? "#FFFF00" : "FF4D4D",
                  }}
                >
                  {event.player.name}
                </span>
                {event.comments && <small> ({event.comments})</small>}
              </div>
            </div>
            <img
              src={
                event.detail === "Yellow Card"
                  ? "/assets/11Votes_Yellow_Card.png"
                  : "/assets/11Votes_Red_Card.png"
              }
              alt="Card Icon"
              height={20}
              style={{ marginRight: "20px" }}
            />
          </div>
        );

      case "Goal":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Goal</strong>: {event.detail}
              <div>
                <span style={{ color: "#4CFF72" }}>{event.player.name}</span>
                {event.assist?.name && (
                  <>
                    {" "}
                    <small>assisted by</small> <span>{event.assist.name}</span>
                  </>
                )}
              </div>
            </div>
            <img
              src="https://img.icons8.com/?size=100&id=cg5jSDHEKVtO&format=png&color=000000"
              alt="Card Icon"
              height={20}
              style={{ marginRight: "20px" }}
            />
          </div>
        );

      case "subst":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Substitution</strong>
              <div>
                <span style={{ color: "#42A5F5" }}>{event.player.name}</span>
                {event.assist?.name && (
                  <>
                    {" "}
                    <small>replaced by</small>{" "}
                    <span style={{ color: "#FFB74D" }}>
                      {event.assist.name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <img
              src="/assets\11Votes_Sub_Icon.png"
              alt="Sub Icon"
              height={20}
              style={{ marginRight: "20px" }}
            />
          </div>
        );

      default:
        return (
          <>
            <strong>{event.type}</strong>: {event.detail}
            <div>
              <span style={{ color: "#4EFF4E" }}>{event.player.name}</span>
              {event.comments && <small> ({event.comments})</small>}
            </div>
          </>
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "10px",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      {/* Team Logo */}
      <div
        style={{
          width: "30px",
          textAlign: "center",
        }}
      >
        <img
          src={event.team.logo}
          alt={event.team.name}
          style={{
            height: "30px",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Event Details */}
      <div style={{ flex: "1", paddingLeft: "10px" }}>
        {renderEventDetails()}
      </div>

      {/* Event Time */}
      <div style={{ marginLeft: "auto", color: "#888" }}>
        {event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ""}
      </div>
    </div>
  );
};

// const EventsDisplay = ({ events }) => {
//   return (
//     <ContentContainer className="events-container">
//       {events.map((event, index) => (
//         <EventItem key={index} event={event} />
//       ))}
//     </ContentContainer>
//   );
// };
