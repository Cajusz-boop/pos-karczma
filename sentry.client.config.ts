import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV ?? "development",

  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Sentry]", event.message ?? event.exception);
      return null;
    }
    return event;
  },
});
