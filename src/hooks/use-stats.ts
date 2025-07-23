// src/hooks/use-stats.ts
import { useMemo } from 'react'

export interface StatsOptions {
  calculateAverage?: boolean
  calculateTotal?: boolean
  calculateMin?: boolean
  calculateMax?: boolean
}

export const useStats = <T, K extends keyof T>(
  items: T[],
  valueField: K,
  options: StatsOptions = {}
) => {
  const stats = useMemo(() => {
    const values = items.map(item => Number(item[valueField])).filter(v => !isNaN(v))
    
    const result: Record<string, number> = {}
    
    if (options.calculateTotal || options.calculateAverage) {
      const total = values.reduce((sum, val) => sum + val, 0)
      if (options.calculateTotal) {
        result.total = total
      }
      if (options.calculateAverage) {
        result.average = values.length > 0 ? total / values.length : 0
      }
    }
    
    if (options.calculateMin && values.length > 0) {
      result.min = Math.min(...values)
    }
    
    if (options.calculateMax && values.length > 0) {
      result.max = Math.max(...values)
    }
    
    return result
  }, [items, valueField, options])
  
  return stats
}