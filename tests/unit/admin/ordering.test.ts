import { describe, expect, it } from 'vitest'
import { isPermutation, moveItem, reorderPositions } from '@/lib/admin/ordering'

describe('reorderPositions', () => {
  it('assigns position = index', () => {
    expect(reorderPositions(['c', 'a', 'b'])).toEqual([
      { id: 'c', position: 0 },
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
    ])
  })

  it('handles an empty list', () => {
    expect(reorderPositions([])).toEqual([])
  })
})

describe('moveItem', () => {
  const list = ['a', 'b', 'c', 'd']

  it('moves an item forward and backward without mutating the input', () => {
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c'])
    expect(list).toEqual(['a', 'b', 'c', 'd'])
  })

  it('clamps the target index', () => {
    expect(moveItem(list, 1, 99)).toEqual(['a', 'c', 'd', 'b'])
    expect(moveItem(list, 2, -5)).toEqual(['c', 'a', 'b', 'd'])
  })

  it('ignores an invalid source index', () => {
    expect(moveItem(list, 9, 0)).toEqual(list)
    expect(moveItem(list, -1, 0)).toEqual(list)
  })

  it('is a no-op when from === to', () => {
    expect(moveItem(list, 2, 2)).toEqual(list)
  })
})

describe('isPermutation', () => {
  it('accepts any order of the same ids', () => {
    expect(isPermutation(['b', 'a'], ['a', 'b'])).toBe(true)
    expect(isPermutation([], [])).toBe(true)
  })

  it('rejects missing, extra, unknown and duplicated ids', () => {
    expect(isPermutation(['a'], ['a', 'b'])).toBe(false)
    expect(isPermutation(['a', 'b', 'c'], ['a', 'b'])).toBe(false)
    expect(isPermutation(['a', 'x'], ['a', 'b'])).toBe(false)
    expect(isPermutation(['a', 'a'], ['a', 'b'])).toBe(false)
  })
})
