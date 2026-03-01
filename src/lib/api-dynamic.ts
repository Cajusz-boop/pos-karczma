/**
 * Export directive for API routes.
 * In Capacitor builds (output: export), API routes are not included,
 * but Next.js still validates them. Using undefined avoids the conflict.
 * In server builds, force-dynamic ensures fresh data on every request.
 */
export const dynamic = process.env.CAPACITOR_BUILD === "1" ? undefined : "force-dynamic";
