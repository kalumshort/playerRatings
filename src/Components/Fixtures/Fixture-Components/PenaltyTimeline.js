import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import Typography from "@mui/material/Typography";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function PenaltyTimeline({ penaltyEvents }) {
  if (!penaltyEvents) {
    return <div className="spinner"></div>;
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Accordion
        style={{
          width: "400px",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Penalty Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Timeline position="alternate">
            {penaltyEvents.map((event, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot
                    style={{
                      backgroundColor: "transparent", // Remove background color
                      padding: 0,
                    }}
                  >
                    <img
                      src={event.team.logo}
                      alt={event.team.name}
                      style={{ width: 30, height: 30 }}
                    />
                  </TimelineDot>
                  {index < penaltyEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    style={{
                      color:
                        event.detail === "Missed Penalty"
                          ? "#FF6B6B"
                          : "#6BCB77",
                    }}
                  >
                    {event.player.name}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
