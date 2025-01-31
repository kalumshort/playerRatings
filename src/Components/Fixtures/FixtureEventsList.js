import React from "react";

export default function FixtureEventsList({
  events,
  eventTypes,
  textAlign,
  goalAlign = "left",
}) {
  // Filter events based on eventTypes prop
  const filteredEvents = events?.filter(
    (event) =>
      (eventTypes.includes(event.type) && event.detail === "Normal Goal") ||
      event.detail === "Own Goal"
  );

  return (
    <ul className="fixure-events-list" style={{ textAlign }}>
      {filteredEvents?.map((event, index) => {
        const time =
          event.time.elapsed + (event.time.extra ? `+${event.time.extra}` : "");

        return goalAlign === "left" ? (
          <li key={index} className="fixure-events-list-item">
            ⚽{event.player.name} {time}'
          </li>
        ) : (
          <li key={index} className="fixure-events-list-item">
            {event.player.name} {time}' ⚽
          </li>
        );
      })}
    </ul>
  );
}

/* const type = event.type === "Goal" ? "Goal" : event.detail; */
