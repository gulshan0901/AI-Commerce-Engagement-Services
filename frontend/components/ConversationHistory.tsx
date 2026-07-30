"use client";

/** Lists saved conversations and reports the currently selected history item. */

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { Button, List, ListItemButton, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { ConversationSummary } from "@/types";

export function ConversationHistory({
  conversations, selectedId, onSelect, onNew,
}: {
  conversations: ConversationSummary[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return <Paper sx={{ p: 1.5, position: { md: "sticky" }, top: 88 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" px={1} mb={1}>
      <Stack direction="row" spacing={1} alignItems="center"><HistoryRoundedIcon color="primary" /><Typography fontWeight={800}>History</Typography></Stack>
      <Button size="small" onClick={onNew} startIcon={<AddRoundedIcon />}>New</Button>
    </Stack>
    <List dense disablePadding>
      {conversations.map((item) => <ListItemButton key={item.id} selected={selectedId === item.id} onClick={() => onSelect(item.id)} sx={{ borderRadius: 2 }}>
        <ListItemText primary={item.title} secondary={new Date(item.updated_at).toLocaleDateString()} primaryTypographyProps={{ noWrap: true }} />
      </ListItemButton>)}
      {!conversations.length && <Typography color="text.secondary" variant="body2" p={1}>Your conversations will appear here.</Typography>}
    </List>
  </Paper>;
}
