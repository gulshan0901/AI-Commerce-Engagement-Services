import { Container, Typography } from "@mui/material";
import { CommerceLayout } from "@/components/CommerceLayout";
import { ProductListing } from "@/features/catalogue/ProductListing";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <CommerceLayout><Container sx={{ py: 7 }}><Typography variant="h2" textTransform="capitalize" mb={4}>{category}</Typography><ProductListing category={category} /></Container></CommerceLayout>;
}
