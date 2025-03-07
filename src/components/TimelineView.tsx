import { TimelineEntry } from '@/types'
import { format } from 'date-fns'
import { Check } from 'lucide-react'

interface TimelineViewProps {
  entries: TimelineEntry[]
}

export function TimelineView({ entries }: TimelineViewProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={index} className="relative pl-8 pb-4">
          <div className="absolute left-0 top-0 h-full w-px bg-gray-200" />
          <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[#9D1FFF] -translate-x-1/2" />
          
          <div className="space-y-1">
            <div className="text-sm text-gray-500">
              {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-line">
              {entry.description}
            </div>
            {entry.next_approach_date && (
              <div className="text-sm text-[#9D1FFF]">
                Next approach: {format(new Date(entry.next_approach_date), 'MMM d, yyyy')}
              </div>
            )}
            {entry.is_converted && (
              <div className="flex items-center text-sm text-green-600 mt-2">
                <Check className="h-4 w-4 mr-1" />
                Converted on {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 