/** Error whose message is safe to show in the admin UI (never wraps internals). */
export class AdminError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'AdminError'
  }
}
