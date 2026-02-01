// Date utility functions

// Helper function to get ordinal suffix
export function getOrdinalSuffix(day: number): string {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Helper function to format date
export function formatDate(): string {
  const now = new Date();
  const relevant = new Date(now);
  const day = now.getDay();
  if (day === 6) {
    relevant.setDate(relevant.getDate() + 2);
  } else if (day === 0) {
    relevant.setDate(relevant.getDate() + 1);
  }
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[relevant.getDay()];
  const monthName = months[relevant.getMonth()];
  const dateNum = relevant.getDate();
  const suffix = getOrdinalSuffix(dateNum);
  
  return `${dayName}, ${monthName} ${dateNum}${suffix}`;
}

// Helper function to format time
export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Helper function to format timestamp
export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleString();
}
