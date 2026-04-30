const DAYS_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShortDate(date) {
  return `${DAYS_SHORT[date.getDay()]} ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/**
 * MeetingCard — displays today's host (if meeting day) or the next upcoming host.
 *
 * Props
 *   title        – card heading (e.g. "DAILY STANDUP")
 *   frequency    – subtitle (e.g. "Every Weekday")
 *   isToday      – true when there is a meeting today
 *   todayEntry   – { host, memberIndex, date } for today's meeting (or null)
 *   upcomingList – array of { host, memberIndex, date } for future meetings
 */
export default function MeetingCard({ title, frequency, isToday, todayEntry, upcomingList }) {
  const nextEntry = upcomingList[0];

  return (
    <div className="meeting-card">
      {/* ── Card Header ── */}
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
      </div>
      <div className="card-frequency">{frequency}</div>

      {/* ── Host Spotlight ── */}
      <div className="card-host">
        {isToday ? (
          <>
            <div className="host-badge">★ TODAY&apos;S HOST ★</div>
            <div className="host-name">{todayEntry.host}</div>
          </>
        ) : (
          <>
            <div className="host-badge host-badge--next">NEXT MEETING HOST</div>
            {nextEntry && (
              <div className="next-date-label">{formatShortDate(nextEntry.date)}</div>
            )}
            <div className="host-name host-name--next">
              {nextEntry?.host ?? '—'}
            </div>
          </>
        )}
      </div>

      {/* ── Upcoming List ── */}
      <div className="upcoming-section">
        <div className="upcoming-heading">── UPCOMING ──</div>
        {upcomingList.length === 0 && (
          <div className="upcoming-empty">No upcoming dates found</div>
        )}
        {upcomingList.map((entry, i) => (
          <div
            key={i}
            className={`upcoming-row${i === 0 && !isToday ? ' upcoming-row--next' : ''}`}
          >
            <span className="upcoming-row-date">{formatShortDate(entry.date)}</span>
            <span className="upcoming-row-arrow">›</span>
            <span className="upcoming-row-host">{entry.host}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
