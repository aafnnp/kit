// src/components/ui/history-panel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, RotateCcw } from 'lucide-react'

interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  [key: string]: any
}

interface HistoryPanelProps<T extends HistoryEntry> {
  history: T[]
  onRestoreSettings: (entry: T) => void
  onClearHistory?: () => void
  renderEntryDetails?: (entry: T) => React.ReactNode
  emptyMessage?: string
}

export function HistoryPanel<T extends HistoryEntry>({
  history,
  onRestoreSettings,
  onClearHistory,
  renderEntryDetails,
  emptyMessage = 'No history yet',
}: HistoryPanelProps<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          History
        </CardTitle>
        {onClearHistory && history.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClearHistory}>
            Clear History
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{entry.description}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {renderEntryDetails && renderEntryDetails(entry)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestoreSettings(entry)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}