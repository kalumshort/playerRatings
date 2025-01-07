import React from "react";

export default function FixtureEventsList({ events, eventTypes, textAlign }) {
  // Filter events based on eventTypes prop
  const filteredEvents = events?.filter((event) =>
    eventTypes.includes(event.type)
  );

  return (
    <ul className="fixure-events-list" style={{ textAlign }}>
      {filteredEvents?.map((event, index) => {
        const time =
          event.time.elapsed + (event.time.extra ? `+${event.time.extra}` : "");
        const type = event.type === "Goal" ? "Goal" : event.detail;
        return (
          <li key={index} className="fixure-events-list-item">
            ⚽ {time}'<br></br>
            {event.player.name}
          </li>
        );
      })}
    </ul>
  );
}
