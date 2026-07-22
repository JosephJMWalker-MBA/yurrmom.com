import type { Creator } from "@/domain/types";

const accentFill = {
  tomato: "#dd4a24",
  sage: "#3d7a61",
  mustard: "#e9a63a",
} as const;

/**
 * Seeded creator avatar: an intentional brand mark, not a fake photo.
 * (docs/05 — no seeded content may imply a real external fact; a photo
 * would imply a real person.)
 */
export function CreatorAvatar({
  creator,
  size = 64,
}: {
  creator: Creator;
  size?: number;
}) {
  const initials = creator.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fill = accentFill[creator.accent];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${creator.displayName} avatar`}
    >
      <path
        d="M32 2c14 0 30 8 30 30 0 20-12 30-30 30S2 52 2 32C2 10 18 2 32 2Z"
        fill={fill}
        stroke="#221a14"
        strokeWidth="2.5"
      />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="22"
        fill="#faf3e7"
      >
        {initials}
      </text>
    </svg>
  );
}
