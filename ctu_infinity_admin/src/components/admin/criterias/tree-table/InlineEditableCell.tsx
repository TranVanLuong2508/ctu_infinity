'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface InlineEditableCellProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
    readOnly?: boolean;
}

export function InlineEditableCell({
    value,
    onSave,
    className = '',
    placeholder = '',
    autoFocus = false,
    readOnly = false,
}: InlineEditableCellProps) {
    const [isEditing, setIsEditing] = React.useState(autoFocus);
    const [editValue, setEditValue] = React.useState(value);
    const [isSaving, setIsSaving] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    React.useEffect(() => {
        if (autoFocus) {
            setIsEditing(true);
        }
    }, [autoFocus]);

    const handleSave = async () => {
        if (editValue.trim() === '') {
            setEditValue(value);
            setIsEditing(false);
            return;
        }

        if (editValue === value) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(editValue);
            setIsEditing(false);
        } catch (error) {
            setEditValue(value);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
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

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 w-full px-1">
                <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className="h-6 text-xs px-1.5 py-0 border-blue-500"
                    placeholder={placeholder}
                    disabled={isSaving}
                />
                {isSaving && (
                    <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => !readOnly && setIsEditing(true)}
            className={`px-1.5 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-100'} h-full flex items-center text-xs w-full`}
        >
            {value || <span className="text-gray-400 italic text-xs">{placeholder}</span>}
        </div>
    );
}
