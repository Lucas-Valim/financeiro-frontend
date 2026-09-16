/**
 * Raised when a request exhausts its time budget. Kept distinct from a generic
 * network failure because the two call for different words: a timeout against a
 * hibernating backend usually means "still starting up, it will answer", while
 * an unreachable host means "it will not". Collapsing both into one message is
 * what left the expenses screen blank with nothing to act on.
 */
export class RequestTimeoutError extends Error {
  constructor(
    message: string = 'O servidor não respondeu no tempo esperado.'
  ) {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}
