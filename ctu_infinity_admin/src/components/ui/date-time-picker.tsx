'use client';

import * as React from 'react';
import { Calendar, CalendarProps } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarDays, Clock } from 'lucide-react';
import { VIETNAM_TZ } from '@/utils/formateDate';

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Chọn ngày và giờ',
  min,
  max,
  required,
  error,
  className,
  minDate,
  maxDate,
  disablePast,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  });
  const [tempHours, setTempHours] = React.useState(() => {
    if (!value) return '08';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '08' : String(d.getHours()).padStart(2, '0');
  });
  const [tempMinutes, setTempMinutes] = React.useState(() => {
    if (!value) return '00';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '00' : String(d.getMinutes()).padStart(2, '0');
  });

  const handleDateSelect: CalendarProps['onSelect'] = (date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const handleApply = () => {
    if (!tempDate) return;
    const d = new Date(tempDate);
    d.setHours(parseInt(tempHours, 10), parseInt(tempMinutes, 10), 0, 0);
    const isoString = format(d, "yyyy-MM-dd'T'HH:mm");
    onChange?.(isoString);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.('');
    setTempDate(undefined);
    setTempHours('08');
    setTempMinutes('00');
    setOpen(false);
  };

  const displayValue = value
    ? (() => {
        const d = new Date(value);
        return isNaN(d.getTime()) ? '' : formatInTimeZone(d, VIETNAM_TZ, "HH:mm - dd/MM/yyyy");
      })()
    : '';

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-start text-left font-normal h-9 px-3',
              !value && 'text-muted-foreground',
              error && 'border-destructive ring-1 ring-destructive',
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {displayValue || <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            {/* Calendar */}
            <div className="border-r border-border">
              <Calendar
                selected={tempDate}
                onSelect={handleDateSelect}
                initialMonth={tempDate}
                minDate={minDate}
                maxDate={maxDate}
                disablePast={disablePast}
              />
            </div>

            {/* Time + Actions */}
            <div className="p-3 space-y-3 min-w-[150px]">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Giờ</span>
              </div>

              {/* Quick picks */}
              <div className="grid grid-cols-3 gap-1.5">
                {['08', '09', '14', '15', '18', '19'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setTempHours(h)}
                    className={cn(
                      'h-7 rounded-md border text-xs font-medium transition-colors',
                      tempHours === h && tempMinutes === '00'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-input bg-background hover:bg-accent text-foreground',
                    )}
                  >
                    {h}:00
                  </button>
                ))}
              </div>

              {/* Custom hour + minute */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={tempHours}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                    setTempHours(String(v).padStart(2, '0'));
                  }}
                  className="w-11 h-7 rounded-md border border-input bg-background text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-xs font-medium">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={tempMinutes}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setTempMinutes(String(v).padStart(2, '0'));
                  }}
                  className="w-11 h-7 rounded-md border border-input bg-background text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                {value && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs text-muted-foreground"
                    onClick={handleClear}
                  >
                    Xóa
                  </Button>
                )}
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleApply}
                  disabled={!tempDate}
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
