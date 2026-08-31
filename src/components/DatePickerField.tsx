import React from 'react'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { TextField, Box, Paper, Backdrop, Modal } from '@mui/material'

interface DatePickerFieldProps {
  label: string
  value: string
  onChange: (date: string) => void
  required?: boolean
  id?: string
  name?: string
  minDate?: Dayjs
  maxDate?: Dayjs
}

export function DatePickerField({
  label,
  value,
  onChange,
  required = false,
  id,
  name,
  minDate,
  maxDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  
  const handleChange = (newValue: Dayjs | null) => {
    if (newValue) {
      onChange(newValue.format('YYYY-MM-DD'))
      setOpen(false)
    }
  }

  const dateValue = value ? dayjs(value) : null
  const displayValue = value ? dayjs(value).format('DD-MMM-YYYY') : ''

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%' }}>
        <TextField
          fullWidth
          required={required}
          id={id}
          name={name}
          label={label}
          value={displayValue}
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
              maxWidth: '350px',
              width: '90%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <DateCalendar
                value={dateValue}
                onChange={handleChange}
                minDate={minDate}
                maxDate={maxDate}
                sx={{
                  '& .MuiPickersDay-root': {
                    fontSize: '0.95rem',
                    color: '#111827',
                    '&:hover': {
                      backgroundColor: '#f3e5f5',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#5a0a8f',
                      color: '#fff',
                      fontWeight: '600',
                      '&:hover': {
                        backgroundColor: '#400466',
                      },
                    },
                    '&.MuiPickersDay-today': {
                      borderColor: '#5a0a8f',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiPickersCalendarHeader-root': {
                    paddingBottom: '16px',
                  },
                  '& .MuiPickersArrowSwitcher-button': {
                    color: '#5a0a8f',
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
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
                type="button"
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
          </Paper>
        </Modal>
      </Box>
    </LocalizationProvider>
  )
}
