/**
 * Table Sorting Utility
 * Reusable sorting logic for dashboard tables
 */

export type SortDirection = 'asc' | 'desc' | null
export type SortConfig<T = Record<string, unknown>> = {
  key: keyof T | string
  direction: SortDirection
}

/**
 * Sort array of objects by a specific key and direction
 */
export function sortData<T>(
  data: T[],
  sortConfig: SortConfig<T> | null
): T[] {
  if (!sortConfig || !sortConfig.direction) {
    return data
  }

  return [...data].sort((a, b) => {
    const { key, direction } = sortConfig
    
    // Handle nested keys (e.g., 'client.name')
    const aValue = getNestedValue(a as Record<string, unknown>, key as string)
    const bValue = getNestedValue(b as Record<string, unknown>, key as string)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return direction === 'asc' ? 1 : -1
    if (bValue == null) return direction === 'asc' ? -1 : 1

    // Compare values
    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      // Fallback to string comparison
      comparison = String(aValue).localeCompare(String(bValue))
    }

    return direction === 'asc' ? comparison : -comparison
  })
}

/**
 * Get nested object value by dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce((current: any, key) => current?.[key], obj as any)
}

/**
 * Toggle sort direction: null -> asc -> desc -> null
 */
export function toggleSortDirection(
  currentKey: string | null,
  newKey: string,
  currentDirection: SortDirection
): SortDirection {
  if (currentKey !== newKey) {
    // New column: start with ascending
    return 'asc'
  }
  
  // Same column: cycle through states
  if (currentDirection === null) return 'asc'
  if (currentDirection === 'asc') return 'desc'
  return null
}

/**
 * Get sort indicator icon (↑/↓)
 */
export function getSortIcon(
  columnKey: string,
  currentKey: string | null,
  direction: SortDirection
): string {
  if (columnKey !== currentKey || !direction) return ''
  return direction === 'asc' ? '↑' : '↓'
}
