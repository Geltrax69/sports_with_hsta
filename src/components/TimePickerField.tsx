import React from 'react'
import { TimeClock } from '@mui/x-date-pickers/TimeClock'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { TextField, Box, Paper, Backdrop, Modal } from '@mui/material'

interface TimePickerFieldProps {
  label: string
  value: string
  onChange: (time: string) => void
  required?: boolean
  id?: string
  name?: string
}

export function TimePickerField({
  label,
  value,
  onChange,
  required = false,
  id,
  name,
}: TimePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [period, setPeriod] = React.useState<'AM' | 'PM'>('AM')

  // Parse the time value to determine AM/PM
  React.useEffect(() => {
    if (value) {
      const [hours] = value.split(':').map(Number)
      const newPeriod = hours >= 12 ? 'PM' : 'AM'
      setPeriod(newPeriod)
    }
  }, [value])

  const handleChange = (newValue: Dayjs | null) => {
    if (newValue) {
      const hours24 = newValue.hour()
      const minutes = newValue.minute()
      
      // Store in 24-hour format
      onChange(`${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    }
  }

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number)
      let newHours = hours
      
      if (newPeriod === 'PM' && hours < 12) {
        newHours = hours + 12
      } else if (newPeriod === 'AM' && hours >= 12) {
        newHours = hours - 12
      }
      
      onChange(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
      setPeriod(newPeriod)
    }
  }

  // Format display time
  const getDisplayTime = () => {
    if (!value) return '--:-- AM'
    const [hours, minutes] = value.split(':').map(Number)
    let display12 = hours
    let displayPeriod = 'AM'
    
    if (hours === 0) {
      display12 = 12
    } else if (hours > 12) {
      display12 = hours - 12
      displayPeriod = 'PM'
    } else if (hours === 12) {
      displayPeriod = 'PM'
    }
    
    return `${String(display12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${displayPeriod}`
  }

  const timeValue = value ? dayjs(`2024-01-01 ${value}`) : dayjs('2024-01-01 00:00')

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%' }}>
        <TextField
          fullWidth
          required={required}
          id={id}
          name={name}
          label={label}
          value={getDisplayTime()}
          onClick={() => setOpen(true)}
          inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              padding: '8px 12px',
              fontSize: '1rem',
              color: '#111827',
              '& fieldset': {
                borderColor: '#d1d5db',
                borderWidth: '2px',
              },
              '&:hover fieldset': {
                borderColor: '#9ca3af',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5a0a8f',
                borderWidth: '2px',
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: '8px 0px',
              cursor: 'pointer',
            },
            '& .MuiFormLabel-root': {
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              '&.Mui-focused': {
                color: '#5a0a8f',
              },
            },
          }}
        />

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              transitionDuration: 500,
              sx: { backgroundColor: 'transparent' },
            },
          }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300,
          }}
        >
          <Paper
            sx={{
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              backgroundColor: '#fff',
              outline: 'none',
              maxWidth: '420px',
              width: '90%',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Time Clock */}
              <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <TimeClock
                  value={timeValue}
                  onChange={handleChange}
                  ampm={true}
                  views={['hours', 'minutes']}
                  sx={{
                    '& .MuiClock-root': {
                      backgroundColor: '#fff',
                    },
                    '& .MuiClockPointer-root': {
                      backgroundColor: '#5a0a8f',
                    },
                    '& .MuiClockNumber-root': {
                      fontSize: '1rem',
                      fontWeight: '500',
                    },
                    '& .MuiClockNumber-root.Mui-selected': {
                      backgroundColor: '#5a0a8f',
                      color: '#fff',
                    },
                  }}
                />
              </Box>

              {/* AM/PM Selector */}
              <Box sx={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                <button
                  onClick={() => handlePeriodChange('AM')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: period === 'AM' ? '#5a0a8f' : '#e5e7eb',
                    color: period === 'AM' ? '#fff' : '#374151',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = period === 'AM' ? '#400466' : '#d1d5db'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = period === 'AM' ? '#5a0a8f' : '#e5e7eb'
                  }}
                >
                  AM
                </button>
                <button
                  onClick={() => handlePeriodChange('PM')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: period === 'PM' ? '#5a0a8f' : '#e5e7eb',
                    color: period === 'PM' ? '#fff' : '#374151',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = period === 'PM' ? '#400466' : '#d1d5db'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = period === 'PM' ? '#5a0a8f' : '#e5e7eb'
                  }}
                >
                  PM
                </button>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#5a0a8f',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#400466'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#5a0a8f'
                  }}
                >
                  Done
                </button>
              </Box>
            </Box>
          </Paper>
        </Modal>
      </Box>
    </LocalizationProvider>
  )
}
