'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

type AccountFilterType = 'all' | 'student' | 'organizer' | 'user';

const OPTIONS: { label: string; value: AccountFilterType }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Sinh viên', value: 'student' },
    { label: 'Ban tổ chức', value: 'organizer' },
    { label: 'Người dùng thường', value: 'user' },
];

interface UserTypeFilterProps {
    value: AccountFilterType;
    onChange: (value: AccountFilterType) => void;
}

export function UserTypeFilter({ value, onChange }: UserTypeFilterProps) {
    const current = OPTIONS.find((o) => o.value === value);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="cursor-pointer gap-2">
                    <Filter className="h-4 w-4" />
                    {current?.label ?? 'Lọc loại tài khoản'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Lọc theo loại tài khoản</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={value}
                    onValueChange={(v) => onChange(v as AccountFilterType)}
                >
                    {OPTIONS.map((opt) => (
                        <DropdownMenuRadioItem
                            key={opt.value}
                            value={opt.value}
                            className="cursor-pointer"
                        >
                            {opt.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
