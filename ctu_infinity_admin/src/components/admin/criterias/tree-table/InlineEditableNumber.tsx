'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditableNumberProps {
  value: number | null;
  onSave: (value: number | null) => Promise<void>;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  errorMessage?: string;
}

export function InlineEditableNumber({
  value,
  onSave,
  disabled = false,
  className = '',
  min,
  max,
  errorMessage,
}: InlineEditableNumberProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value?.toString() ?? '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === '') {
      setIsSaving(true);
      try {
        await onSave(null);
        setIsEditing(false);
        setError(null);
      } catch (error) {
        setEditValue(value?.toString() ?? '');
        setError('Lỗi khi lưu');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const numValue = Number(editValue);
    if (isNaN(numValue)) {
      setError('Giá trị không hợp lệ');
      return;
    }

    if (!Number.isInteger(numValue)) {
      setError('Giá trị phải là số nguyên');
      return;
    }

    if (min !== undefined && numValue < min) {
      setError(`Giá trị phải >= ${min}`);
      return;
    }

    if (max !== undefined && numValue > max) {
      setError(`Giá trị phải <= ${max}`);
      return;
    }

    if (numValue === value) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(numValue);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      setEditValue(value?.toString() ?? '');
      setError('Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value?.toString() ?? '');
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <div
        className="text-gray-500 text-center text-xs h-full flex items-center justify-center w-full px-1"
        title={errorMessage}
      >
        {value !== null ? value : <span className="text-gray-300">-</span>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-1 px-1">
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="h-6 text-center text-xs px-1 py-0 border-blue-500"
            disabled={isSaving}
            min={min}
            max={max}
            step={1}
          />
          {isSaving && (
            <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
          )}
        </div>
        {error && <span className="text-xs text-red-500 px-1">{error}</span>}
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-100 text-center h-full flex items-center justify-center text-xs w-full"
    >
      {value !== null ? value : <span className="text-gray-400">-</span>}
    </div>
  );
}
