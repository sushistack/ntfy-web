import { Chip } from "@/components/ui/Chip";

export function TopicChip({ name, as, onClick }) {
  const handleClick = as === "button" && onClick
    ? (e) => { e.stopPropagation(); onClick(); }
    : onClick;

  return (
    <Chip variant="topic" as={as ?? "span"} onClick={handleClick}>
      {name}
    </Chip>
  );
}
