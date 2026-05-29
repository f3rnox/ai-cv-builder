/**
 * Formats a date string into a relative time-ago string (e.g., 'Just now', '5m ago', '2h ago').
 * Falls back to local date format if the date is older than 30 days.
 * 
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} The relative time string.
 */
export default function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 0) {
    return 'Just now'
  }
  if (seconds < 60) {
    return 'Just now'
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days}d ago`
  }
  
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}
