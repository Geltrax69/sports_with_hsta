/**
 * Convert 24-hour time format to 12-hour format
 * @param time - Time string in HH:mm format (24-hour)
 * @returns Time string in 12-hour format (e.g., "01:30 PM")
 */
export function formatTo12Hour(time: string): string {
  if (!time) return ''
  
  try {
    const [hours, minutes] = time.split(':').map(Number)
    
    if (isNaN(hours) || isNaN(minutes)) return time
    
    let displayHours = hours
    let period = 'AM'
    
    if (hours === 0) {
      displayHours = 12
    } else if (hours === 12) {
      period = 'PM'
    } else if (hours > 12) {
      displayHours = hours - 12
      period = 'PM'
    }
    
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}

/**
 * Convert 24-hour time to 12-hour format (no leading zero on hours)
 * @param time - Time string in HH:mm format (24-hour)
 * @returns Time string in 12-hour format (e.g., "1:30 PM")
 */
export function formatTo12HourShort(time: string): string {
  if (!time) return ''
  
  try {
    const [hours, minutes] = time.split(':').map(Number)
    
    if (isNaN(hours) || isNaN(minutes)) return time
    
    let displayHours = hours
    let period = 'AM'
    
    if (hours === 0) {
      displayHours = 12
    } else if (hours === 12) {
      period = 'PM'
    } else if (hours > 12) {
      displayHours = hours - 12
      period = 'PM'
    }
    
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}
