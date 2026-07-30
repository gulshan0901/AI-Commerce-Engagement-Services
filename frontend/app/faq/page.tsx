/** Renders accessible expandable answers to common commerce questions. */
import { Accordion, AccordionDetails, AccordionSummary, Container, Typography } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { CommerceLayout } from "@/components/CommerceLayout";

const faqs = [
  ["How does ACE choose products?", "ACE retrieves products from the application catalogue, applies your constraints, and uses AI only to rank and explain known records."],
  ["Does the assistant invent products?", "No. Recommendations are validated against catalogue identifiers before they are returned."],
  ["Can I shop without AI?", "Yes. Products, categories, details, cart, checkout, and orders work as a conventional commerce journey."],
  ["Is checkout real?", "Checkout validates products and persists the authenticated customer's order in Supabase. Payment collection is intentionally not enabled yet."],
  ["What does ACE remember?", "Only explicit shopping preferences such as budget, favorite brands, and sizes, plus recent conversation turns."],
];

export default function FaqPage() {
  return <CommerceLayout><Container maxWidth="md" sx={{ py: 7 }}><Typography variant="h2" mb={4}>Frequently asked questions</Typography>{faqs.map(([question, answer]) => <Accordion key={question}><AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography fontWeight={800}>{question}</Typography></AccordionSummary><AccordionDetails><Typography color="text.secondary">{answer}</Typography></AccordionDetails></Accordion>)}</Container></CommerceLayout>;
}
