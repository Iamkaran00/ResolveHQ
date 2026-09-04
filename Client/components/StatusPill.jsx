import { Badge } from "@mantine/core";

const STYLE = {
  new: { color: "#5B6B8C", bg: "#EDEFF4" },
  open: { color: "#2F8F5B", bg: "#E8F3EC" },
  pending: { color: "#C97A2B", bg: "#FBF0E4" },
  resolved: { color: "#5B6B8C", bg: "#EDEFF4" },
  closed: { color: "#7A828E", bg: "#EFEFEF" },
};

export default function StatusPill({ status }) {
  const s = STYLE[status] || STYLE.new;
  return (
    <Badge size="sm" radius="sm" variant="light" styles={{ root: { color: s.color, backgroundColor: s.bg, textTransform: "none", fontWeight: 600 } }}>
      {status}
    </Badge>
  );
}