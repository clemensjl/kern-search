// 1.5px-Stroke-Set nach DESIGN.md. Ersetzt die Glyphen aus dem Zeichensatz.
type P = { size?: number };

function Svg({ size = 20, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

export const IcSearch = ({ size }: P) => (
  <Svg size={size}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></Svg>
);
export const IcClose = ({ size }: P) => (
  <Svg size={size}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const IcFilter = ({ size }: P) => (
  <Svg size={size}><path d="M4 7h11M19 7h1M4 17h4M12 17h8" /><circle cx="17" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>
);
export const IcGrid = ({ size }: P) => (
  <Svg size={size}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></Svg>
);
export const IcRows = ({ size }: P) => (
  <Svg size={size}><rect x="4" y="5" width="16" height="5" rx="1" /><rect x="4" y="14" width="16" height="5" rx="1" /></Svg>
);
export const IcPlus = ({ size }: P) => (
  <Svg size={size}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IcCheck = ({ size }: P) => (
  <Svg size={size}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>
);
export const IcShield = ({ size }: P) => (
  <Svg size={size}><path d="M12 3.5 5 6.2v5c0 4.2 2.9 7.6 7 9.3 4.1-1.7 7-5.1 7-9.3v-5z" /></Svg>
);
export const IcBookmark = ({ size }: P) => (
  <Svg size={size}><path d="M6.5 4.5h11v15l-5.5-3.6-5.5 3.6z" /></Svg>
);
export const IcUpload = ({ size }: P) => (
  <Svg size={size}><path d="M12 16V5m0 0L8 9m4-4 4 4M5 19h14" /></Svg>
);
export const IcUser = ({ size }: P) => (
  <Svg size={size}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c1.3-3.2 3.9-4.8 7-4.8s5.7 1.6 7 4.8" /></Svg>
);
export const IcSun = ({ size }: P) => (
  <Svg size={size}><circle cx="12" cy="12" r="4" /><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></Svg>
);
export const IcMoon = ({ size }: P) => (
  <Svg size={size}><path d="M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5" /></Svg>
);
export const IcArrow = ({ size }: P) => (
  <Svg size={size}><path d="M5 12h13m0 0-5-5m5 5-5 5" /></Svg>
);
export const IcChevronLeft = ({ size }: P) => (
  <Svg size={size}><path d="m14.5 5-6 7 6 7" /></Svg>
);
export const IcChevronRight = ({ size }: P) => (
  <Svg size={size}><path d="m9.5 5 6 7-6 7" /></Svg>
);
export const IcShuffle = ({ size }: P) => (
  <Svg size={size}><path d="M4 6h3l10 12h3M4 18h3l3-3.6M14 8.6 17 6h3" /><path d="M17.5 3.5 20.5 6l-3 2.5M17.5 15.5 20.5 18l-3 2.5" /></Svg>
);
