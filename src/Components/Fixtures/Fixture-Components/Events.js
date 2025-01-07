import React from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";

export default function Events({ events }) {
  if (!events) {
    return (
      <ContentContainer className="events-container">
        <h2 className="heading2" style={{ textAlign: "center" }}>
          No Events
        </h2>
      </ContentContainer>
    );
  }
  return (
    <ContentContainer className="events-container">
      <h2 className="heading2" style={{ textAlign: "center" }}>
        Events
      </h2>

      {events.map((event, index) => (
        <EventItem key={index} event={event} />
      ))}
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
                  ? "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-yellow.svg"
                  : "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-red.svg"
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
                    <small>assisted by</small>{" "}
                    <span style={{ color: "#8FD8FF" }}>
                      {event.assist.name}
                    </span>
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
                <span style={{ color: "#8EE69A" }}>{event.player.name}</span>
                {event.assist?.name && (
                  <>
                    {" "}
                    <small>replaced by</small>{" "}
                    <span style={{ color: "#FF9A9E" }}>
                      {event.assist.name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <img
              src="https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/sub-w.svg"
              alt="Card Icon"
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

const EventsDisplay = ({ events }) => {
  return (
    <ContentContainer className="events-container">
      {events.map((event, index) => (
        <EventItem key={index} event={event} />
      ))}
    </ContentContainer>
  );
};
