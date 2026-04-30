import { useState, useRef, useLayoutEffect } from 'react';
import {
  getWeeklyHost,
  getUpcomingWeekly,
  getBiweeklyHost,
  getUpcomingBiweekly,
  isBiweeklyTuesday,
} from './utils/rotation';
import PickerWheel from './components/PickerWheel';
import './App.css';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const ENV_TEAM_NAME    = import.meta.env.APP_TEAM_NAME    ?? 'Team';
const ENV_COMPANY_NAME = import.meta.env.APP_COMPANY_NAME ?? '';
const ENV_STANDUP = (import.meta.env.APP_STANDUP_MEETING ?? import.meta.env.APP_TEAM_MEMBERS)
  .split(',').map(s => s.trim());
const ENV_SPRINT  = (import.meta.env.APP_SPRINT_REVIEW_MEETING ?? import.meta.env.APP_TEAM_MEMBERS)
  .split(',').map(s => s.trim());

function loadOrder(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === fallback.length) return parsed;
    }
  } catch {}
  return fallback;
}

function saveOrder(key, order) {
  try { localStorage.setItem(key, JSON.stringify(order)); } catch {}
}

function getWeekDays(today) {
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function dayAfter(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Scales its h1 font-size down until the text fits its container width */
function FitText({ children, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lo = 8, hi = 120;
    el.style.fontSize = hi + 'px';
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = mid + 'px';
      if (el.scrollWidth > el.offsetWidth) hi = mid;
      else lo = mid;
    }
    el.style.fontSize = lo + 'px';
  }, [children]);
  return (
    <h1
      ref={ref}
      className={className}
      style={{ whiteSpace: 'nowrap', width: '100%', overflow: 'hidden' }}
    >
      {children}
    </h1>
  );
}

/** Modal with drag-to-reorder list */
function ReorderModal({ title, emoji, variant, order, onSave, onClose }) {
  const [draft, setDraft]   = useState([...order]);
  const dragIdx             = useRef(null);
  const liveOrder           = useRef([...order]);

  function handleDragStart(i) {
    dragIdx.current   = i;
    liveOrder.current = [...draft];
  }

  function handleDragEnter(i) {
    if (dragIdx.current === null || i === dragIdx.current) return;
    const next = [...liveOrder.current];
    next.splice(i, 0, next.splice(dragIdx.current, 1)[0]);
    liveOrder.current = next;
    dragIdx.current   = i;
    setDraft([...next]);
  }

  function handleDragEnd() {
    dragIdx.current = null;
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal modal--${variant}`}>
        <div className="modal-header">
          <span className="modal-title">
            <span>{emoji}</span> {title} — Rotation Order
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="modal-hint">Drag to reorder</p>
        <ol className="modal-list">
          {draft.map((name, i) => (
            <li
              key={name}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragOver={e => e.preventDefault()}
              onDragEnd={handleDragEnd}
              className="modal-item"
            >
              <span className="modal-handle">⠿</span>
              <span className="modal-rank">{i + 1}</span>
              <span className="modal-name">{name}</span>
            </li>
          ))}
        </ol>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>Cancel</button>
          <button className={`modal-btn modal-btn--save modal-btn--save-${variant}`} onClick={() => { onSave(draft); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const today     = new Date();
  const [weekOffset, setWeekOffset] = useState(0);

  // View week (offset 0 = this week, 1 = next week, etc.)
  const viewMonday = (() => {
    const d = new Date(today);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const viewWeekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(viewMonday);
    d.setDate(viewMonday.getDate() + i);
    return d;
  });
  const monthYear = `${MONTHS[viewMonday.getMonth()]} ${viewMonday.getFullYear()}`;

  const [standupOrder, setStandupOrder] = useState(() => loadOrder('standupOrder', ENV_STANDUP));
  const [sprintOrder,  setSprintOrder]  = useState(() => loadOrder('sprintOrder',  ENV_SPRINT));
  const [editingModal, setEditingModal] = useState(null); // 'standup' | 'sprint' | null

  function updateStandupOrder(order) { setStandupOrder(order); saveOrder('standupOrder', order); }
  function updateSprintOrder(order)  { setSprintOrder(order);  saveOrder('sprintOrder',  order); }

  // ── Standup ──────────────────────────────────────────────────────────────
  const weeklyToday    = getWeeklyHost(today, standupOrder);
  const isWeekday      = weeklyToday !== null && weekOffset === 0;
  const upcomingWeekly = getUpcomingWeekly(weeklyToday ? dayAfter(today) : today, 4, standupOrder);
  const weeklyDisplay  = weekOffset === 0
    ? (weeklyToday ?? upcomingWeekly[0])
    : (getWeeklyHost(viewMonday, standupOrder) ?? getUpcomingWeekly(viewMonday, 1, standupOrder)[0]);

  // ── Sprint Review ─────────────────────────────────────────────────────────
  const biweeklyIsToday  = isBiweeklyTuesday(today) && weekOffset === 0;
  const viewSprintTue    = viewWeekDays.find(d => isBiweeklyTuesday(d));
  const biweeklyThisWeek = !!viewSprintTue;
  const nextSprint       = getUpcomingBiweekly(today, 1, sprintOrder)[0];
  const biweeklyDisplay  = weekOffset === 0
    ? (biweeklyIsToday ? getBiweeklyHost(today, sprintOrder) : nextSprint)
    : (viewSprintTue ? getBiweeklyHost(viewSprintTue, sprintOrder) : getUpcomingBiweekly(viewMonday, 1, sprintOrder)[0]);

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app-header">
        {ENV_COMPANY_NAME && <div className="app-company">{ENV_COMPANY_NAME}</div>}
        <FitText className="app-title">
          <span style={{WebkitTextFillColor:'initial'}}>✨ </span>{ENV_TEAM_NAME}<span style={{WebkitTextFillColor:'initial'}}> ✨</span>
        </FitText>
      </header>

      {/* ── Week Strip ── */}
      <section className="week-strip">
        <div className="week-heading">
          <span>{weekOffset === 0 ? '📅 This Week' : weekOffset === 1 ? '📅 Next Week' : '📅 Week'}{biweeklyThisWeek
              ? <span className="week-note week-note--active"> ★ Sprint Review this Tuesday</span>
              : <span className="week-note week-note--none"> ★ No Sprint Review this week</span>
            }</span>
          <span className="week-heading-right">
            <span className="week-month">{monthYear}</span>
          </span>
        </div>
        <div className="week-days">
          {weekOffset > 0 && (
            <button className="week-arrow week-arrow--back" onClick={() => setWeekOffset(0)} aria-label="Back to current week" data-tooltip="Current Week">«</button>
          )}
          {viewWeekDays.map((d, i) => {
            const isToday  = isSameDay(d, today);
            const isBiweek = isBiweeklyTuesday(d);
            return (
              <div key={i} className={`wday${isToday ? ' wday--today' : ''}`}>
                <span className="wday-name">{DAY_SHORT[d.getDay()]}</span>
                <span className="wday-num">{d.getDate()}</span>
                {isBiweek && <span className="wday-star">★</span>}
              </div>
            );
          })}
          <button className="week-arrow week-arrow--next" onClick={() => setWeekOffset(o => o + 1)} aria-label="Next week" data-tooltip="Next Week">»</button>
        </div>
      </section>

      {/* ── Wheels ── */}
      <div className="wheels-grid">
        <div className="pw-wrapper">
          <PickerWheel
            members={standupOrder}
            selectedIndex={weeklyDisplay?.memberIndex ?? 0}
            label="Standup"
            emoji="☕"
            active={isWeekday}
            variant="pink"
          />
          <button
            className="edit-btn edit-btn--pink"
            onClick={() => setEditingModal('standup')}
            aria-label="Edit standup rotation order"
          >✎</button>
        </div>

        <div className="pw-wrapper">
          <PickerWheel
            members={sprintOrder}
            selectedIndex={biweeklyDisplay?.memberIndex ?? 0}
            label="Sprint Review"
            emoji="📋"
            active={biweeklyIsToday}
            variant="lav"
          />
          {!biweeklyThisWeek && (
            <div className="no-sprint-banner">★ No Sprint Review this week</div>
          )}
          <button
            className="edit-btn edit-btn--lav"
            onClick={() => setEditingModal('sprint')}
            aria-label="Edit sprint review rotation order"
          >✎</button>
        </div>
      </div>

      {/* ── Wheels ── */}
      {editingModal === 'standup' && (
        <ReorderModal
          title="Standup"
          emoji="☕"
          variant="pink"
          order={standupOrder}
          onSave={updateStandupOrder}
          onClose={() => setEditingModal(null)}
        />
      )}
      {editingModal === 'sprint' && (
        <ReorderModal
          title="Sprint Review"
          emoji="📋"
          variant="lav"
          order={sprintOrder}
          onSave={updateSprintOrder}
          onClose={() => setEditingModal(null)}
        />
      )}

    </div>
  );
}

