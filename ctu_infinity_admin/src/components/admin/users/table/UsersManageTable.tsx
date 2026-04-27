'use client';

import * as React from 'react';
import {
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { IUserManage } from '@/types/user.type';
import { UserManagementService } from '@/services/user-management.service';
import { userManageColumns } from './UserManageColumns';
import { UserTypeFilter } from '../UserTypeFilter';
import { toast } from 'sonner';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';

type AccountFilterType = 'all' | 'student' | 'organizer' | 'user';

interface UsersManageTableProps {
    /** When provided, the filter is locked to this type and the dropdown is hidden. */
    defaultAccountType?: AccountFilterType;
}

export function UsersManageTable({ defaultAccountType }: UsersManageTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const [userList, setUserList] = React.useState<IUserManage[]>([]);
    const [accountTypeFilter, setAccountTypeFilter] = React.useState<AccountFilterType>(
        defaultAccountType ?? 'all',
    );
    const [searchText, setSearchText] = React.useState('');

    // Server-side pagination state
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [totalItems, setTotalItems] = React.useState(0);
    const PAGE_SIZE = 10;

    const fetchUsers = React.useCallback(async () => {
        try {
            const res = await UserManagementService.CallGetAllUsersWithProfiles(
                page,
                PAGE_SIZE,
                accountTypeFilter,
            );
            if (res?.EC === 1 && res.data) {
                setUserList(res.data.users ?? []);
                setTotalPages(res.data.pagination?.totalPages ?? 1);
                setTotalItems(res.data.pagination?.totalItems ?? 0);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Lỗi khi tải danh sách người dùng');
        }
    }, [page, accountTypeFilter]);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (userId: string) => {
        try {
            const res = await UserManagementService.CallDeleteUser(userId);
            if (res?.EC === 1) {
                toast.success('Xóa người dùng thành công');
                fetchUsers();
            } else {
                toast.error(res?.EM || 'Không thể xóa người dùng');
            }
        } catch {
            toast.error('Lỗi khi xóa người dùng');
        }
    };

    const handleRestore = async (userId: string) => {
        try {
            const res = await UserManagementService.CallRestoreUser(userId);
            if (res?.EC === 1) {
                toast.success('Khôi phục người dùng thành công');
                fetchUsers();
            } else {
                toast.error(res?.EM || 'Không thể khôi phục người dùng');
            }
        } catch {
            toast.error('Lỗi khi khôi phục người dùng');
        }
    };

    // Reset to page 1 when filter changes
    const handleFilterChange = (value: AccountFilterType) => {
        setAccountTypeFilter(value);
        setPage(1);
    };

    // Client-side search filtering
    const filteredUsers = React.useMemo(() => {
        if (!searchText.trim()) return userList;
        const lower = searchText.toLowerCase();
        return userList.filter(
            (u) =>
                u.fullName?.toLowerCase().includes(lower) ||
                u.email?.toLowerCase().includes(lower) ||
                u.phoneNumber?.toLowerCase().includes(lower),
        );
    }, [userList, searchText]);

    const tableWithSearch = useReactTable({
        data: filteredUsers,
        columns: userManageColumns(handleDelete, handleRestore),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
    });

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <Input
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="max-w-sm"
                />
                {/* Only show filter dropdown when not locked to a specific type */}
                {!defaultAccountType && (
                    <UserTypeFilter value={accountTypeFilter} onChange={handleFilterChange} />
                )}
                <span className="ml-auto text-sm text-muted-foreground">
                    Tổng: <strong>{totalItems}</strong> người dùng
                </span>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {tableWithSearch.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {tableWithSearch.getRowModel().rows.length ? (
                            tableWithSearch.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={
                                        row.original.isDeleted
                                            ? 'bg-gray-200 opacity-60 hover:bg-gray-200'
                                            : 'bg-white'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Không có dữ liệu
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <SimpleTablePagination
                page={page}
                totalPages={totalPages}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                onPageSizeChange={() => {}}
                totalCount={totalItems}
            />
        </div>
    );
}
