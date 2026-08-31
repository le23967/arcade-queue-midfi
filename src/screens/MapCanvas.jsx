/* The drawn map.

   Kept as vector art rather than a tile server: no API key, no external
   requests, no photography. The shapes follow the real area the three venues
   sit in, so the layout reads as Sydney rather than as an abstract grid.
   Broadway runs along the south, George Street cuts north east toward Town
   Hall, Darling Harbour is off to the north west, and there is parkland at
   Chippendale and again near Belmore. */
export default function MapCanvas() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="100" height="100" fill="#f2f1ee" />

      {/* Water, north west */}
      <path
        d="M-5 -5 L26 -5 L18 10 L6 16 L-5 14 Z"
        fill="#cfe3ee"
      />

      {/* Parkland */}
      <path d="M2 68 L20 64 L24 78 L6 84 Z" fill="#d8e8d2" />
      <path d="M62 40 L78 36 L82 50 L66 55 Z" fill="#d8e8d2" />
      <circle cx="88" cy="72" r="7" fill="#d8e8d2" />

      {/* City blocks */}
      <g fill="#e6e5e1">
        <rect x="30" y="18" width="14" height="11" rx="1" />
        <rect x="48" y="10" width="12" height="9" rx="1" />
        <rect x="66" y="14" width="10" height="8" rx="1" />
        <rect x="30" y="56" width="12" height="10" rx="1" />
        <rect x="44" y="70" width="16" height="12" rx="1" />
        <rect x="14" y="34" width="13" height="10" rx="1" />
        <rect x="72" y="60" width="11" height="9" rx="1" />
        <rect x="6" y="46" width="10" height="8" rx="1" />
      </g>

      {/* Road casing, then the road itself, so streets read as streets */}
      <g stroke="#dedcd6" fill="none">
        <path d="M-5 92 L105 8" strokeWidth="7" />
        <path d="M-5 62 L105 46" strokeWidth="5.5" />
        <path d="M40 -5 L58 105" strokeWidth="5.5" />
      </g>
      <g stroke="#ffffff" fill="none" strokeLinecap="round">
        <path d="M-5 92 L105 8" strokeWidth="5" />
        <path d="M-5 62 L105 46" strokeWidth="3.6" />
        <path d="M40 -5 L58 105" strokeWidth="3.6" />
      </g>

      {/* Minor streets */}
      <g stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M-5 78 L105 -6" />
        <path d="M-5 46 L105 30" />
        <path d="M14 -5 L30 105" />
        <path d="M68 -5 L84 105" />
        <path d="M-5 24 L60 -5" />
      </g>
      <g stroke="#eceae5" strokeWidth="0.9" fill="none">
        <path d="M-5 84 L105 0" />
        <path d="M-5 54 L105 38" />
        <path d="M26 -5 L44 105" />
        <path d="M54 -5 L72 105" />
      </g>

      {/* Street names, small, for orientation only */}
      <g
        fill="#a9a69f"
        fontSize="2.6"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        <text x="6" y="88" transform="rotate(-37 6 88)">BROADWAY</text>
        <text x="60" y="47" transform="rotate(-37 60 47)">GEORGE ST</text>
        <text x="45" y="26" transform="rotate(80 45 26)">PITT ST</text>
      </g>
    </svg>
  )
}
