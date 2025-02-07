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
      event.detail === "Own Goal" ||
      (event.detail === "Penalty" && event.comment !== "Penalty Shootout")
  );

  return (
    <ul className="fixure-events-list" style={{ textAlign }}>
      {filteredEvents?.map((event, index) => {
        const time =
          event.time.elapsed + (event.time.extra ? `+${event.time.extra}` : "");

        return goalAlign === "left" ? (
          <li key={index} className="fixure-events-list-item">
            <img
              key={index}
              src={
                event.detail === "Own Goal"
                  ? "https://img.icons8.com/?size=100&id=LDze7ETPiEDu&format=png&color=FA5252"
                  : event.detail === "Penalty"
                  ? "https://img.icons8.com/?size=100&id=P54DbuwUMItC&format=png&color=000000"
                  : "https://img.icons8.com/?size=100&id=cg5jSDHEKVtO&format=png&color=000000"
              }
              alt="Goal Icon"
              width={20}
              height={20}
            />
            {event.player.name} {time}'
          </li>
        ) : (
          <li
            key={index}
            className="fixure-events-list-item"
            style={{ justifyContent: "end" }}
          >
            {event.player.name} {time}'{" "}
            <img
              key={index}
              src={
                event.detail === "Own Goal"
                  ? "https://img.icons8.com/?size=100&id=LDze7ETPiEDu&format=png&color=FA5252"
                  : event.detail === "Penalty"
                  ? "https://img.icons8.com/?size=100&id=P54DbuwUMItC&format=png&color=000000"
                  : "https://img.icons8.com/?size=100&id=cg5jSDHEKVtO&format=png&color=000000"
              }
              alt="Goal Icon"
              width={20}
              height={20}
            />
          </li>
        );
      })}
    </ul>
  );
}

/* const type = event.type === "Goal" ? "Goal" : event.detail; */
