export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 mb-4">
      <p className="text-sm font-medium">⚠️ {message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-bold text-red-700 hover:text-red-900 underline whitespace-nowrap"
        >
          Retry
        </button>
      )}
    </div>
  );
}
