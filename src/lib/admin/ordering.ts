/** Position (= index) for every id of an ordered list. */
export function reorderPositions(ids: readonly string[]): { id: string; position: number }[] {
  return ids.map((id, position) => ({ id, position }))
}

/** Returns a copy of `list` with the item at `from` moved to `to` (indexes are clamped). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list]
  if (from < 0 || from >= copy.length) return copy
  const target = Math.max(0, Math.min(copy.length - 1, to))
  const [item] = copy.splice(from, 1)
  copy.splice(target, 0, item as T)
  return copy
}

/** True when `ids` contains exactly the `existing` ids, each once (any order). */
export function isPermutation(ids: readonly string[], existing: readonly string[]): boolean {
  if (ids.length !== existing.length) return false
  const wanted = new Set(existing)
  const seen = new Set<string>()
  for (const id of ids) {
    if (!wanted.has(id) || seen.has(id)) return false
    seen.add(id)
  }
  return true
}
