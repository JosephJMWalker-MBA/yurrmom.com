/**
 * Deb — the current roast's fictional subject. A deliberately synthetic
 * flat illustration (docs/07 provenance boundary 4: roast subjects are
 * fictional by construction; this one cannot even be mistaken for a photo).
 */
export function DebIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 300"
      role="img"
      aria-label="Illustration of Deb, a fictional character, proudly holding a laminated color-coded chore chart"
      className={className}
    >
      {/* backdrop blob */}
      <path
        d="M160 8c86 0 150 52 150 140 0 84-58 144-150 144S10 232 10 148C10 60 74 8 160 8Z"
        fill="#e9a63a"
        opacity="0.35"
      />
      {/* body */}
      <path
        d="M92 300c0-52 30-78 68-78s68 26 68 78"
        fill="#3d7a61"
        stroke="#221a14"
        strokeWidth="5"
      />
      {/* head */}
      <circle cx="160" cy="132" r="56" fill="#f2c9a0" stroke="#221a14" strokeWidth="5" />
      {/* bun */}
      <circle cx="160" cy="62" r="24" fill="#8a5a33" stroke="#221a14" strokeWidth="5" />
      <path
        d="M104 128c2-38 22-58 56-58s54 20 56 58"
        fill="#8a5a33"
        stroke="#221a14"
        strokeWidth="5"
      />
      {/* glasses */}
      <circle cx="138" cy="132" r="15" fill="#fffcf5" stroke="#221a14" strokeWidth="5" />
      <circle cx="182" cy="132" r="15" fill="#fffcf5" stroke="#221a14" strokeWidth="5" />
      <line x1="153" y1="132" x2="167" y2="132" stroke="#221a14" strokeWidth="5" />
      {/* eyes */}
      <circle cx="138" cy="132" r="4" fill="#221a14" />
      <circle cx="182" cy="132" r="4" fill="#221a14" />
      {/* determined smile */}
      <path d="M144 162q16 12 32 0" fill="none" stroke="#221a14" strokeWidth="5" strokeLinecap="round" />
      {/* the chart, laminated (shine mark) */}
      <g transform="rotate(-6 70 220)">
        <rect x="28" y="188" width="96" height="104" rx="6" fill="#fffcf5" stroke="#221a14" strokeWidth="5" />
        <line x1="28" y1="214" x2="124" y2="214" stroke="#221a14" strokeWidth="3" />
        <line x1="60" y1="188" x2="60" y2="292" stroke="#221a14" strokeWidth="3" />
        <line x1="92" y1="188" x2="92" y2="292" stroke="#221a14" strokeWidth="3" />
        <rect x="34" y="222" width="20" height="12" fill="#dd4a24" />
        <rect x="66" y="240" width="20" height="12" fill="#e9a63a" />
        <rect x="98" y="224" width="20" height="12" fill="#3d7a61" />
        <rect x="34" y="258" width="20" height="12" fill="#3d7a61" />
        <rect x="98" y="262" width="20" height="12" fill="#dd4a24" />
        {/* lamination shine */}
        <line x1="40" y1="196" x2="52" y2="184" stroke="#e9a63a" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* holding arm */}
      <path
        d="M120 240q-30 4-44 -6"
        fill="none"
        stroke="#3d7a61"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <circle cx="76" cy="232" r="10" fill="#f2c9a0" stroke="#221a14" strokeWidth="4" />
      {/* version tag */}
      <g transform="rotate(8 262 84)">
        <rect x="228" y="64" width="68" height="34" rx="6" fill="#dd4a24" stroke="#221a14" strokeWidth="4" />
        <text
          x="262"
          y="87"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight="800"
          fontSize="18"
          fill="#fffcf5"
        >
          v47
        </text>
      </g>
    </svg>
  );
}
