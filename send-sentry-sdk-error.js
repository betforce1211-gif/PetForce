const Sentry = require('@sentry/node');

// Initialize with correct DSN
Sentry.init({
  dsn: 'https://48e223edad869076554be572bb836cc4@o4510824642052096.ingest.us.sentry.io/4510824680849408',
  environment: 'development',
  tracesSampleRate: 1.0,
});

console.log('Sending error via Sentry SDK...');

// Capture the exact error they want
try {
  throw new Error('This is your first error!');
} catch (error) {
  Sentry.captureException(error);
  console.log('Error captured!');
}

// Flush and wait
Sentry.close(2000).then(() => {
  console.log('✅ Done! Check Sentry dashboard.');
});
