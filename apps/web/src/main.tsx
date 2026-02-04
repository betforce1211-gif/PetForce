import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import './index.css';

Sentry.init({
  dsn: "https://48e223edad869076554be572bb836cc4@o4510824642052096.ingest.us.sentry.io/4510824680849408",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container!);
root.render(<App />);
