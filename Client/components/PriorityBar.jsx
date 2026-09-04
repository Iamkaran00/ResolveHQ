const COLOR = { urgent: "#9E2B3E", high: "#C97A2B", medium: "#5B6B8C", low: "#B7BEC9" };

export default function PriorityBar({ priority }) {
  return <div style={{ width: 4, alignSelf: "stretch", background: COLOR[priority] || "#B7BEC9", borderRadius: 2 }} />;
}