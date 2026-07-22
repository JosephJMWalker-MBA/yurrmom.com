import type { MerchItem } from "@/domain/types";

/**
 * Flat SVG merch mockups — honest seeded imagery (docs/05): no photography
 * pretending to be real product shots from a connected fulfillment pipeline.
 */
export function MerchArt({ item, className = "" }: { item: MerchItem; className?: string }) {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label={`${item.title} illustration`} className={className}>
      <rect width="200" height="160" rx="10" fill="#fffcf5" />
      {art[item.kind]}
    </svg>
  );
}

const wordmark = (
  <text
    x="100"
    y="84"
    textAnchor="middle"
    fontFamily="var(--font-display)"
    fontWeight="800"
    fontSize="12"
    fill="#faf3e7"
  >
    YURR MOM.
  </text>
);

const art: Record<MerchItem["kind"], React.ReactNode> = {
  tee: (
    <g>
      <path
        d="M60 30 84 20q16 10 32 0l24 10 18 26-22 14v60H64V70L42 56Z"
        fill="#221a14"
        stroke="#221a14"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {wordmark}
    </g>
  ),
  mug: (
    <g>
      <rect x="48" y="36" width="88" height="88" rx="10" fill="#dd4a24" stroke="#221a14" strokeWidth="4" />
      <path d="M136 54h14a16 16 0 0 1 0 44h-14" fill="none" stroke="#221a14" strokeWidth="6" />
      <text x="92" y="76" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#faf3e7">
        POWERED BY
      </text>
      <text x="92" y="91" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#faf3e7">
        OTHER PEOPLE&#8217;S
      </text>
      <text x="92" y="106" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#faf3e7">
        MISTAKES
      </text>
    </g>
  ),
  cap: (
    <g>
      <path d="M50 96a50 42 0 0 1 100 0Z" fill="#3d7a61" stroke="#221a14" strokeWidth="4" />
      <path d="M48 96h124a8 8 0 0 1-2 14H60a12 12 0 0 1-12-14Z" fill="#2c5c48" stroke="#221a14" strokeWidth="4" />
      <text x="100" y="86" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="12" fill="#faf3e7">
        PROVEN
      </text>
      <text x="100" y="99" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="12" fill="#faf3e7">
        SYSTEM
      </text>
    </g>
  ),
  tote: (
    <g>
      <path d="M60 56h80v76H60Z" fill="#e9a63a" stroke="#221a14" strokeWidth="4" />
      <path d="M78 56q0-28 22-28t22 28" fill="none" stroke="#221a14" strokeWidth="5" />
      <text x="100" y="88" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#221a14">
        THIS TOTE
      </text>
      <text x="100" y="101" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#221a14">
        CONTAINS
      </text>
      <text x="100" y="114" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#221a14">
        A SYSTEM
      </text>
    </g>
  ),
  stickers: (
    <g>
      <rect x="42" y="40" width="52" height="52" rx="10" transform="rotate(-8 68 66)" fill="#dd4a24" stroke="#221a14" strokeWidth="4" />
      <rect x="106" y="36" width="52" height="52" rx="10" transform="rotate(6 132 62)" fill="#3d7a61" stroke="#221a14" strokeWidth="4" />
      <rect x="74" y="80" width="52" height="52" rx="10" transform="rotate(-3 100 106)" fill="#e9a63a" stroke="#221a14" strokeWidth="4" />
      <text x="100" y="112" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="11" fill="#221a14">
        v47
      </text>
      <text x="68" y="72" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="10" fill="#faf3e7" transform="rotate(-8 68 66)">
        DEB
      </text>
      <text x="132" y="68" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="18" fill="#faf3e7" transform="rotate(6 132 62)">
        🧦
      </text>
    </g>
  ),
};
