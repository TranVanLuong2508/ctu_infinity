'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IUserManage, AccountType } from '@/types/user.type';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2, RotateCcw, GraduationCap, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/utils/formateDate';

const accountTypeBadge: Record<AccountType, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    STUDENT: { label: 'Sinh viên', variant: 'default' },
    ORGANIZER: { label: 'Ban tổ chức', variant: 'secondary' },
    USER: { label: 'Người dùng', variant: 'outline' },
};

interface ActionsProps {
    row: IUserManage;
    onDelete: (userId: string) => void;
    onRestore: (userId: string) => void;
}

function ActionCell({ row, onDelete, onRestore }: ActionsProps) {
    const router = useRouter();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* View/Edit basic info */}
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/users/${row.userId}`)}
                >
                    <Eye className="mr-2 h-4 w-4" />
                    Xem / Sửa thông tin
                </DropdownMenuItem>

                {/* Manage student profile */}
                {row.accountType === 'STUDENT' && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/users/${row.userId}/student`)}
                    >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Quản lý Sinh viên
                    </DropdownMenuItem>
                )}

                {/* Manage organizer profile */}
                {row.accountType === 'ORGANIZER' && (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/users/${row.userId}/organizer`)}
                    >
                        <Building2 className="mr-2 h-4 w-4" />
                        Quản lý Ban tổ chức
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {row.isDeleted ? (
                    <DropdownMenuItem
                        className="cursor-pointer text-green-600 focus:text-green-700"
                        onClick={() => onRestore(row.userId)}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Khôi phục
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-700"
                        onClick={() => onDelete(row.userId)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa người dùng
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const userManageColumns = (
    onDelete: (userId: string) => void,
    onRestore: (userId: string) => void,
): ColumnDef<IUserManage>[] => [
        {
            id: 'stt',
            header: 'STT',
            cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'fullName',
            header: 'Họ tên',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.fullName}</p>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            ),
        },
        {
            accessorKey: 'phoneNumber',
            header: 'Số điện thoại',
            cell: ({ row }) => row.original.phoneNumber || <span className="text-muted-foreground">—</span>,
        },
        {
            accessorKey: 'accountType',
            header: 'Loại tài khoản',
            cell: ({ row }) => {
                const type = row.original.accountType;
                const config = accountTypeBadge[type];
                return <Badge variant={config.variant}>{config.label}</Badge>;
            },
        },
        {
            accessorKey: 'role',
            header: 'Vai trò',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.role?.roleName || '—'}</span>
            ),
        },
        {
            accessorKey: 'isDeleted',
            header: 'Trạng thái',
            cell: ({ row }) =>
                row.original.isDeleted ? (
                    <Badge variant="destructive">Đã xóa</Badge>
                ) : (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">Hoạt động</Badge>
                ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Ngày tạo',
            cell: ({ row }) =>
                row.original.createdAt
                    ? formatDateTime(row.original.createdAt)
                    : '—',
        },
        {
            id: 'actions',
            header: 'Thao tác',
            enableHiding: false,
            cell: ({ row }) => (
                <ActionCell
                    row={row.original}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            ),
        },
    ];
