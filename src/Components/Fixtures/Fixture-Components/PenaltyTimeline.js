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
        width: "90%",
        margin: "auto",
      }}
    >
      <Accordion
        style={{
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{
            padding: "6px 12px",
            minHeight: "40px !important",
            "& .MuiAccordionSummary-content": {
              margin: 0,
            },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              letterSpacing: "0.3px",
            }}
          >
            Penalty Shootout
          </Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ p: 1.5 }}>
          <Timeline
            position="alternate"
            sx={{
              padding: 0,
              "& .MuiTimelineItem-root": {
                minHeight: "30px", // reduce vertical space
              },
              "& .MuiTimelineContent-root": {
                py: 0.2, // tighter padding top/bottom
              },
              "& .MuiTimelineDot-root": {
                margin: 0, // remove extra margin
              },
            }}
          >
            {penaltyEvents.reverse().map((event, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot
                    style={{
                      backgroundColor: "transparent",
                      padding: 0,
                    }}
                  >
                    {event.detail === "Missed Penalty" ? "❌" : "✅"}
                  </TimelineDot>
                  {index < penaltyEvents.length - 1 && (
                    <TimelineConnector sx={{ minHeight: 20 }} />
                  )}
                </TimelineSeparator>

                <TimelineContent
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        event.detail === "Missed Penalty"
                          ? "#FF6B6B"
                          : "#6BCB77",
                      fontSize: "0.85rem",
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
