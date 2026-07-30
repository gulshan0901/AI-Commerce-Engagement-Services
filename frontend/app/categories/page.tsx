import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import { Container, Grid, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { CommerceLayout } from "@/components/CommerceLayout";

const categories = [
  { name: "Laptops", slug: "laptops", icon: <ComputerRoundedIcon fontSize="large" />, copy: "Portable workstations and gaming performance." },
  { name: "Shoes", slug: "shoes", icon: <DirectionsRunRoundedIcon fontSize="large" />, copy: "Road, trail, and everyday movement." },
  { name: "Audio", slug: "audio", icon: <HeadphonesRoundedIcon fontSize="large" />, copy: "Wireless listening and focused work." },
];

export default function CategoriesPage() {
  return <CommerceLayout><Container sx={{ py: 7 }}><Typography variant="h2" mb={4}>Shop by category</Typography><Grid container spacing={2}>{categories.map((category) => <Grid key={category.slug} size={{ xs: 12, md: 4 }}><Paper component={Link} href={`/categories/${category.slug}`} sx={{ p: 4, display: "block", height: "100%", color: "inherit", textDecoration: "none", transition: ".2s", "&:hover": { transform: "translateY(-4px)", borderColor: "primary.main" } }}><Stack spacing={2}>{category.icon}<Typography variant="h4" fontWeight={850}>{category.name}</Typography><Typography color="text.secondary">{category.copy}</Typography></Stack></Paper></Grid>)}</Grid></Container></CommerceLayout>;
}

