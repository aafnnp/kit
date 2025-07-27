// src/hooks/use-history.ts
import { useState, useCallback } from 'react'

export interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  [key: string]: any
}

export const useHistory = <T extends HistoryEntry>(maxEntries = 10) => {
  const [history, setHistory] = useState<T[]>([])

  const addToHistory = useCallback((entry: T) => {
    setHistory(prev => [entry, ...prev.slice(0, maxEntries - 1)])
  }, [maxEntries])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id))
  }, [])

  const getHistoryEntry = useCallback((id: string) => {
    return history.find(entry => entry.id === id)
  }, [history])

  const updateHistoryEntry = useCallback((id: string, updates: Partial<T>) => {
    setHistory(prev => prev.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    ))
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryEntry,
    updateHistoryEntry
  }
}