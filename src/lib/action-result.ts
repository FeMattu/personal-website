/** Uniform result of every server action: never throw to the UI. */
export type ActionResult<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> }

export const ok = <T = undefined>(data?: T): ActionResult<T> => ({ ok: true, data })
export const fail = (
  error: string,
  fieldErrors?: Record<string, string>,
): { ok: false; error: string; fieldErrors?: Record<string, string> } => ({
  ok: false,
  error,
  fieldErrors,
})
