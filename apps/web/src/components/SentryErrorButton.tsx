/**
 * Sentry Error Test Button
 * Component to verify Sentry error tracking is working
 */
export function SentryErrorButton() {
  return (
    <button
      className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded shadow-lg z-50"
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
  );
}
