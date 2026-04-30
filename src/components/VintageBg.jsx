// Colours match the design tokens in App.css
const NAVY  = '#1B2A4A';
const RED   = '#D42B2B';
const GOLD  = '#F5C518';
const CREAM = '#FFF8E1';

const toRad = (deg) => (deg * Math.PI) / 180;

/** Returns SVG polygon points string for a 5-pointed star. */
function starPoints(cx, cy, outer, inner) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = toRad(i * 36 - 90);
    const r = i % 2 === 0 ? outer : inner;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

function Star({ cx, cy, r, fill = NAVY, opacity = 0.08 }) {
  return <polygon points={starPoints(cx, cy, r, r * 0.42)} fill={fill} opacity={opacity} />;
}

/** Classic nautical anchor (centred at 0,0, ~120 px tall). */
function Anchor({ x, y, size = 1, opacity = 0.07 }) {
  const s = size;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity} fill="none" stroke={NAVY} strokeLinecap="round" strokeLinejoin="round">
      {/* Crown ring */}
      <circle cx="0" cy="-52" r="14" strokeWidth="8" />
      {/* Shaft */}
      <line x1="0" y1="-38" x2="0" y2="38" strokeWidth="8" />
      {/* Stock (crossbar) */}
      <line x1="-32" y1="-26" x2="32" y2="-26" strokeWidth="8" />
      {/* Bottom ring */}
      <circle cx="0" cy="38" r="10" strokeWidth="6" />
      {/* Left fluke */}
      <path d="M -5,30 Q -30,30 -30,46 Q -30,58 -14,58" strokeWidth="7" />
      {/* Right fluke */}
      <path d="M  5,30 Q  30,30  30,46 Q  30,58  14,58" strokeWidth="7" />
    </g>
  );
}

export default function VintageBg() {
  // Sunburst radiates from below the viewport (dramatic upward sweep)
  const sunCx = 600, sunCy = 980;
  const RAY_COUNT = 40;
  const RAY_LEN   = 2000;

  const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
    const angle = (i * 360) / RAY_COUNT;
    const half  = (360 / RAY_COUNT) * 0.45;
    const a1 = toRad(angle - half);
    const a2 = toRad(angle + half);
    const even = i % 2 === 0;
    return (
      <path
        key={i}
        d={`M${sunCx},${sunCy}
            L${sunCx + RAY_LEN * Math.cos(a1)},${sunCy + RAY_LEN * Math.sin(a1)}
            L${sunCx + RAY_LEN * Math.cos(a2)},${sunCy + RAY_LEN * Math.sin(a2)}Z`}
        fill={even ? '#E8DFC0' : CREAM}
      />
    );
  });

  // Halftone dot grid (bottom corners fade in)
  const hDots = [];
  const dotRows = 6, dotCols = 6;
  for (let row = 0; row < dotRows; row++) {
    for (let col = 0; col < dotCols; col++) {
      const r = Math.max(1.5, 5.5 - row * 0.7 - col * 0.3);
      // bottom-left cluster
      hDots.push(
        <circle key={`bl-${row}-${col}`}
          cx={18 + col * 18} cy={795 - row * 18}
          r={r} fill={NAVY} opacity={0.07}
        />
      );
      // bottom-right cluster
      hDots.push(
        <circle key={`br-${row}-${col}`}
          cx={1182 - col * 18} cy={795 - row * 18}
          r={r} fill={NAVY} opacity={0.07}
        />
      );
    }
  }

  // Faint horizontal ruling lines (vintage paper / poster sheet)
  const rulingLines = Array.from({ length: 46 }, (_, i) => (
    <line key={i} x1="0" y1={i * 18} x2="1200" y2={i * 18}
      stroke="#C8BB8A" strokeWidth="0.5" opacity="0.35" />
  ));

  return (
    <svg
      className="vintage-bg-svg"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* ── Base ── */}
      <rect width="1200" height="800" fill={CREAM} />

      {/* ── Sunburst ── */}
      {rays}

      {/* ── Ruling lines ── */}
      {rulingLines}

      {/* ── Halftone corner dots ── */}
      {hDots}

      {/* ── Large anchor — top left ── */}
      <Anchor x={105} y={130} size={1.6} opacity={0.065} />

      {/* ── Large nautical star — top right ── */}
      <Star cx={1085} cy={115} r={88} fill={NAVY} opacity={0.055} />

      {/* ── Accent stars ── */}
      <Star cx={58}   cy={680} r={34} fill={RED}  opacity={0.10} />
      <Star cx={1148} cy={660} r={30} fill={RED}  opacity={0.10} />
      <Star cx={210}  cy={370} r={20} fill={GOLD} opacity={0.18} />
      <Star cx={990}  cy={390} r={22} fill={GOLD} opacity={0.18} />
      <Star cx={600}  cy={72}  r={24} fill={NAVY} opacity={0.07} />
      <Star cx={340}  cy={730} r={16} fill={NAVY} opacity={0.07} />
      <Star cx={860}  cy={740} r={16} fill={NAVY} opacity={0.07} />

      {/* ── Bottom decorative rope-style divider ── */}
      <path
        d="M0,790 Q60,778 120,790 Q180,802 240,790 Q300,778 360,790
           Q420,802 480,790 Q540,778 600,790 Q660,802 720,790
           Q780,778 840,790 Q900,802 960,790 Q1020,778 1080,790
           Q1140,802 1200,790"
        stroke={NAVY} strokeWidth="3" fill="none" opacity="0.12"
        strokeDasharray="6 3"
      />
    </svg>
  );
}
