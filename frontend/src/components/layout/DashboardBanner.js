'use client';

// Same idea as the greeting banner on the other in-house app: a warm,
// time-aware welcome instead of a plain page header.

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

  return (
    <div className="banner-in relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="banner-float absolute -right-16 -top-20 h-64 w-64 rounded-3xl bg-white/10 blur-xl" />
        <div
          className="banner-float absolute -bottom-24 -left-16 h-56 w-56 rounded-3xl bg-accent-500/20 blur-xl"
          style={{ animationDelay: '1.5s' }}
        />
        {/* Static glass sheen across the top, plus a slow light sweep for the "glossy" feel */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
        <div className="banner-shine absolute -top-1/2 left-0 h-[200%] w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-2">
            <p className="text-xl font-bold sm:text-2xl">
              <span className="banner-wave mr-2">{greeting.icon}</span>
              {greeting.text}
              {displayName ? ',' : '!'}
            </p>
            {displayName && (
              <p className="mt-0.5 text-lg font-bold text-amber-200 sm:mt-0 sm:text-2xl">{displayName}!</p>
            )}
          </div>
          <p className="mt-1 text-sm text-white/75">{greeting.note ?? subtitle}</p>
        </div>
        <div className="flex-shrink-0 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
          {today}
        </div>
      </div>
    </div>
  );
}
