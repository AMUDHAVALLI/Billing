'use client';

// Same idea as the greeting banner on the other in-house app: a warm,
// time-aware welcome instead of a plain page header. Re-picks the "signed
// off for the night" subtitle and the decorative icon layout on every
// mount, so it doesn't look frozen the same way on every visit.

const DECOR_ICONS = ['📊', '💰', '🏆', '⭐', '🏦', '💡'];
const DECOR_SLOTS = [
  { left: 8, top: 22, size: 'text-lg', opacity: 'opacity-20' },
  { left: 18, top: 72, size: 'text-lg', opacity: 'opacity-20' },
  { left: 32, top: 42, size: 'text-lg', opacity: 'opacity-30' },
  { left: 60, top: 78, size: 'text-lg', opacity: 'opacity-25' },
  { left: 70, top: 30, size: 'text-2xl', opacity: 'opacity-20' },
  { left: 90, top: 62, size: 'text-lg', opacity: 'opacity-25' },
];

function pickDecor() {
  let previous = null;
  return DECOR_SLOTS.map((slot) => {
    let icon = DECOR_ICONS[Math.floor(Math.random() * DECOR_ICONS.length)];
    for (let attempt = 0; icon === previous && attempt < 5; attempt++) {
      icon = DECOR_ICONS[Math.floor(Math.random() * DECOR_ICONS.length)];
    }
    previous = icon;
    return {
      icon,
      left: slot.left + (Math.random() * 6 - 3),
      top: slot.top + (Math.random() * 12 - 6),
      size: slot.size,
      opacity: slot.opacity,
      delay: Math.random() * 4,
    };
  });
}

const NIGHT_NOTES = [
  'The ledgers will still be here tomorrow.',
  'Time to wind down. Rest well.',
  'Good work deserves good rest.',
  'Books closed for today. See you tomorrow.',
];

// 12am–5:59am "Good Day", 6am–11:59am "Good Morning", 12pm–3:59pm "Good
// Afternoon", 4pm–7:59pm "Good Evening", 8pm–11:59pm "Good Night".
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Good Day', icon: '🌅' };
  if (hour < 12) return { text: 'Good Morning', icon: '☀️' };
  if (hour < 16) return { text: 'Good Afternoon', icon: '☀️' };
  if (hour < 20) return { text: 'Good Evening', icon: '🌇' };
  return {
    text: 'Good Night',
    icon: '🌙',
    note: NIGHT_NOTES[Math.floor(Math.random() * NIGHT_NOTES.length)],
  };
}

export default function DashboardBanner({ displayName, subtitle }) {
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const decor = pickDecor();

  return (
    <div className="banner-in relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="banner-float absolute -right-16 -top-20 h-64 w-64 rounded-3xl bg-white/10 blur-xl" />
        <div
          className="banner-float absolute -bottom-24 left-1/3 h-56 w-56 rounded-3xl bg-accent-500/20 blur-xl"
          style={{ animationDelay: '1.5s' }}
        />
        <div className="banner-glow absolute left-6 top-6 h-10 w-10 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
        <div
          className="banner-glow absolute left-1/2 bottom-3 h-16 w-16 -translate-x-1/2 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"
          style={{ animationDelay: '0.9s' }}
        />
        {decor.map((item, i) => (
          <span
            key={i}
            aria-hidden
            className={`banner-rise absolute -translate-x-1/2 -translate-y-1/2 ${item.size} ${item.opacity}`}
            style={{ left: `${item.left}%`, top: `${item.top}%`, animationDelay: `${item.delay}s` }}
          >
            {item.icon}
          </span>
        ))}
      </div>

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-xl font-bold sm:text-2xl">
            <span className="mr-2">{greeting.icon}</span>
            {greeting.text}!
          </p>
          {displayName && (
            <p className="mt-0.5 text-lg font-bold text-amber-200 sm:text-xl">{displayName}</p>
          )}
          <p className="mt-1 text-sm text-white/75">{greeting.note ?? subtitle}</p>
        </div>
        <div className="flex-shrink-0 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
          {today}
        </div>
      </div>
    </div>
  );
}
