/** Hosts the searchable and infinitely paginated product catalogue. */
import { Container, Stack, Typography } from "@mui/material";
import { CommerceLayout } from "@/components/CommerceLayout";
import { ProductListing } from "@/features/catalogue/ProductListing";

export default function ProductsPage() {
  return <CommerceLayout><Container sx={{ py: 7 }}><Stack spacing={1} mb={4}><Typography variant="h2">Products</Typography><Typography color="text.secondary">Explore the catalogue directly—no AI required.</Typography></Stack><ProductListing /></Container></CommerceLayout>;
}
