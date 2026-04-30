import { useEffect, useState } from 'react';

// Must match --pw-item-h CSS custom property (64px)
const ITEM_H  = 64;
const VISIBLE = 5;   // odd — middle item is the selection window
const REPEATS = 7;   // repeat list this many times for the spin effect

/**
 * PickerWheel
 *
 * Props:
 *   members       — string[]   ordered list of all team members
 *   selectedIndex — number     0-based index of the member to land on
 *   label         — string     short caption above the wheel
 *   emoji         — string     emoji shown in the label
 *   active        — boolean    true = meeting is happening today (highlights border)
 */
export default function PickerWheel({ members, selectedIndex, label, emoji, active, variant = 'pink' }) {
  const [spinning, setSpinning] = useState(false);

  // Mount: wait one tick so the browser paints the start position,
  // then trigger the CSS transition by flipping `spinning`.
  useEffect(() => {
    const id = setTimeout(() => setSpinning(true), 80);
    return () => clearTimeout(id);
  }, []);

  // Build the long repeated list
  const items      = Array.from({ length: REPEATS }, () => members).flat();
  const midRepeat  = Math.floor(REPEATS / 2);                     // 3
  const landingIdx = midRepeat * members.length + selectedIndex;

  // translateY so that item at `landingIdx` is centred in the viewport.
  // Centre of viewport (for VISIBLE=5, ITEM_H=64) = 2 * 64 = 128px from top.
  // Item i centre = i * 64 + 32.
  // T + (i * 64 + 32) = 128  →  T = 128 - 32 - i * 64 = 96 - i * 64
  // Simplified: T = (Math.floor(VISIBLE/2)) * ITEM_H - landingIdx * ITEM_H
  const startY = Math.floor(VISIBLE / 2) * ITEM_H;          // item 0 centred
  const finalY = startY - landingIdx * ITEM_H;               // target centred

  return (
    <div className={`pw pw--${variant}${active ? ' pw--active' : ''}`}>
      <div className="pw-label">
        <span className="pw-emoji">{emoji}</span>
        {label}
      </div>

      <div className="pw-viewport">
        {/* Highlight band — rendered behind the track via z-index */}
        <div className="pw-band" />

        {/* Scrolling track */}
        <div
          className="pw-track"
          style={{
            transform: `translateY(${spinning ? finalY : startY}px)`,
            transition: spinning
              ? 'transform 1.9s cubic-bezier(0.08, 0.82, 0.28, 1)'
              : 'none',
          }}
        >
          {items.map((name, i) => (
            <div key={i} className="pw-item">
              {name}
            </div>
          ))}
        </div>

        {/* Gradient fade overlays (top & bottom) */}
        <div className="pw-fade pw-fade-top" />
        <div className="pw-fade pw-fade-bottom" />
      </div>
    </div>
  );
}
