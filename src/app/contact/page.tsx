import ContactForm from "@/components/client/Footer/ContactForm";
import { Container, Box, Typography } from "@mui/material";

export const metadata = {
  title: "Contact Us | 11Votes",
  description:
    "Report bugs, suggest features, or just say hello to the 11Votes team.",
};

export default function Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <ContactForm />
    </Container>
  );
}
