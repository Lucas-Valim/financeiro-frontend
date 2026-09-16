/**
 * Budget for a single HTTP request. Deliberately generous: the backend
 * hibernates when idle and its cold start was measured at up to ~2 minutes, so
 * the previous 10s meant the client gave up long before the server could
 * answer. That is what surfaced as `canceled` requests and an empty screen —
 * the server was never refusing anything, the client was abandoning it.
 *
 * The trade-off is accepted knowingly: a genuinely unreachable server now takes
 * this long to report failure, which is why the UI announces the wait (see
 * `SLOW_REQUEST_NOTICE_MS`) instead of showing an undifferentiated spinner.
 */
export const COLD_START_TIMEOUT_MS = 90000;

/**
 * How long a request may load quietly before the UI explains that the server is
 * probably still starting up. This is when we start telling the user, not when
 * we give up.
 */
export const SLOW_REQUEST_NOTICE_MS = 8000;
