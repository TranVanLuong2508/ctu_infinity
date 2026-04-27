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

import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { permisionColumns } from './PermissionsColumns';
import { IPermissionn } from '@/types/permission.type';
import { PermmissionService } from '@/services/permission.service';
import '../../../../styles/HideScroll.css';
import { CreatePermissionModal } from '../modals/CreatePermissionModal';
import { EditPermissionModal } from '../modals/EditPermissionModal';
import { ConfirmDeletePermissionModal } from '../modals/ConfirmDeletePermissionModal';

export function PermissionsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [permissionList, setPermissionList] = React.useState<IPermissionn[]>(
    []
  );
  const [originalPermissions, setOriginalPermissions] = React.useState<
    IPermissionn[]
  >([]);

  const [openAddPermisisonModal, setOpenAddPermisisonModal] =
    React.useState(false);
  const [openEditPermisisonModal, setOpenEditPermisisonModal] =
    React.useState(false);
  const [openRestorePermisisonModal, setOpenRestorePermissionModal] =
    React.useState(false);

  const [editingPermissionId, setEditingPermissionId] = React.useState<
    string | null
  >(null);
  const [deletingPermission, setDeletingPermission] =
    React.useState<IPermissionn | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const handleEditPermisison = (permissionId: string) => {
    setEditingPermissionId(permissionId);
    setOpenEditPermisisonModal(true);
  };

  const handleDeletePermission = (permissionId: string) => {
    const perToDelete = permissionList.find(
      (item) => item.permissionId === permissionId
    );
    setDeletingPermission(perToDelete ?? null);
    setConfirmDeleteOpen(true);
  };

  const table = useReactTable({
    data: permissionList,
    columns: permisionColumns(handleEditPermisison, handleDeletePermission),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    fetchPermisisonData();
  }, []);

  const fetchPermisisonData = async () => {
    try {
      const res = await PermmissionService.CallFetchPermissionList();
      if (res?.EC === 1 && res.data?.permissions) {
        setPermissionList(res.data.permissions);
      }
    } catch (error) {
      console.log('Error loading permissions:', error);
    }
  };

  const fetchPermissionDataToTop = async (permissionId: string) => {
    try {
      const res = await PermmissionService.CallFetchPermissionList();

      if (res?.EC === 1 && res.data?.permissions) {
        const permissions = res.data.permissions;
        const updatedRole = permissions.find(
          (r) => r.permissionId === permissionId
        );

        if (!updatedRole) {
          setOriginalPermissions(permissions);
          setPermissionList(permissions);
          return;
        }

        const newList = [
          updatedRole,
          ...permissions.filter((r) => r.permissionId !== permissionId),
        ];

        setOriginalPermissions(newList);
        setPermissionList(newList);
      }
    } catch (error) {
      console.log('Error fetch permission data to top:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setOpenAddPermisisonModal(true);
  };

  const handleCloseCreateModal = () => {
    setOpenAddPermisisonModal(false);
  };

  const handleOpenEditModal = (permissionId: string) => {
    setOpenEditPermisisonModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditPermisisonModal(false);
  };
  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center py-4 gap-3">
          <Input
            placeholder="Tìm theo tên quyền hạn..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button
            onClick={() => handleOpenCreateModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all duration-300"
          >
            + Thêm quyền hạn
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto cursor-pointer">
                <Settings2 /> Xem
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Chuyển đổi cột</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const columnNames: Record<string, string> = {
                    permissionId: 'ID',
                    name: 'Tên quyền hạn',
                    apiPath: 'Api Path',
                    method: 'Method',
                    module: 'Module',
                    // isDeleted: "Trạng thái xóa",
                    createdAt: 'Ngày tạo',
                    updatedAt: 'Ngày chỉnh sửa',
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize cursor-pointer"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnNames[column.id]}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const deleted = row.original.isDeleted;

                  return (
                    <TableRow
                      key={row.id}
                      className={
                        row.original.isDeleted
                          ? 'bg-gray-200 opacity-50 hover:bg-gray-200'
                          : 'bg-white'
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={permisionColumns.length}
                    className="h-24 text-center "
                  >
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>

      <CreatePermissionModal
        open={openAddPermisisonModal}
        onClose={handleCloseCreateModal}
        onSuccess={(newPermissionId) => {
          fetchPermissionDataToTop(newPermissionId);
        }}
      />

      <EditPermissionModal
        open={openEditPermisisonModal}
        onClose={handleCloseEditModal}
        permissionId={editingPermissionId}
        onSuccess={(updatedPermissionId) => {
          fetchPermissionDataToTop(updatedPermissionId);
        }}
      />

      <ConfirmDeletePermissionModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        permission={deletingPermission}
        onSuccess={(permissionId) => {
          fetchPermissionDataToTop(permissionId);
        }}
      />
    </>
  );
}
