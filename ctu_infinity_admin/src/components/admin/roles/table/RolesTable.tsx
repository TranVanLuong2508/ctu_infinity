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
import { filteType, IRole } from '@/types/role.type';
import { RoleService } from '@/services/role.service';
import { roleColumns } from './RoleColums';
import { CreateRoleModal } from '../modals/CreateRoleModal';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { EditRoleModal } from '../modals/EditRoleModal';
import { ConfirmDeleteRoleModal } from '../modals/ConfirmDeleteRoleModal';
import { DropdownFilter } from '@/components/admin/roles/DropdownFilter';
import { toast } from 'sonner';

export function RolesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [roleList, setRoleList] = React.useState<IRole[]>([]);
  const [originalRoles, setOriginalRoles] = React.useState<IRole[]>([]);

  const [openAddRoleModal, setOpenAddRoleModal] = React.useState(false);
  const [openEditRoleModal, setOpenEditRoleModal] = React.useState(false);
  const [openRestoreRoleModal, setOpenRestoreRoleModal] = React.useState(false);

  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
  const [deletingRole, setDeletingRole] = React.useState<IRole | null>(null);
  const [restoringRole, setRestoringRole] = React.useState<IRole | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<filteType>('all');

  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleteMeta, setDeleteMeta] = React.useState<{
    userCount: number;
    alternativeRoles: { roleId: string; roleName: string }[];
  } | null>(null);

  const handleEditRole = (roleId: string) => {
    setEditingRoleId(roleId);
    setOpenEditRoleModal(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const role = roleList.find((r) => r.roleId === roleId) || null;
      setDeletingRole(role);

      const res = await RoleService.CallCheckRoleBeforeDelete(roleId);

      console.log('Check res CallCheckRoleBeforeDelete: ', res);

      if (res?.EC === 1 && res.data) {
        setDeleteMeta({
          userCount: res.data.userCount,
          alternativeRoles: res.data.alternativeRoles,
        });
        setConfirmDeleteOpen(true);
      } else if (res?.EC === 0) {
        toast.error('Không thể xoá vai trò');
      }
    } catch (error) {
      console.error('Error check delete role:', error);
      toast.error('Lỗi khi kiểm tra vai trò trước khi xoá');
    }
  };

  const handleReassignAndDelete = async (targetRoleId: string) => {
    if (!deletingRole) return;
    try {
      const res = await RoleService.CallReassignAndDeleteRole(
        deletingRole.roleId,
        targetRoleId
      );
      console.log('Check res CallReassignAndDeleteRole: ', res);

      if (res?.EC === 1) {
        toast.success('Chuyển người dùng & xoá vai trò thành công');
        await fetchRoleData();
      } else {
        toast.error('Không thể xoá vai trò');
      }
    } catch (error) {
      console.error('Error reassign & delete:', error);
      toast.error('Lỗi khi chuyển role & xoá');
    }
  };

  const handleDeleteWithoutUser = async () => {
    if (!deletingRole) return;
    try {
      const res = await RoleService.CallDeleteRole(deletingRole.roleId);
      console.log('Check res handleDeleteWithoutUser: ', res);

      if (res?.EC === 1) {
        toast.success('Xoá vai trò thành công');
        fetchRoleData();
      } else {
        toast.error('Không thể xoá vai trò');
      }
    } catch (error) {
      console.error('Error delete role:', error);
      toast.error('Lỗi khi xoá vai trò');
    }
  };

  const handleRestoreRole = async (roleId: string) => {
    try {
      const role = roleList.find((r) => r.roleId === roleId) || null;
      setRestoringRole(role);
      const res = await RoleService.CallRestoreRole(roleId);
      console.log('Check res CallCheckRoleBeforeDelete: ', res);
      if (res?.EC === 1 && res.data) {
        toast.success(`khôi mục ROLE: ${res.data.roleName} `);
        fetchRoleData();
      } else {
        toast.success(`khôi mục vai trò thất bại`);
      }
    } catch (error) {
      console.error('Error restore role:', error);
      toast.error('Lỗi khi khôi phục vai trò');
    }
  };

  const table = useReactTable({
    data: roleList,
    columns: roleColumns(handleEditRole, handleDeleteRole, handleRestoreRole),
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
    fetchRoleData();
  }, []);

  React.useEffect(() => {
    applyFilter(statusFilter);
  }, [statusFilter, originalRoles]);

  const fetchRoleData = async () => {
    try {
      const res = await RoleService.CallFetchRolesList();
      if (res?.EC === 1 && res.data?.roles) {
        setOriginalRoles(res.data.roles);
      }
    } catch (error) {
      console.log('Error loading roles:', error);
    }
  };

  const fetchRoleDataToTop = async (roleId: string) => {
    try {
      const res = await RoleService.CallFetchRolesList();

      if (res?.EC === 1 && res.data?.roles) {
        const roles = res.data.roles;
        const updatedRole = roles.find((r) => r.roleId === roleId);

        if (!updatedRole) {
          setOriginalRoles(roles);
          setRoleList(roles);
          return;
        }

        const newList = [
          updatedRole,
          ...roles.filter((r) => r.roleId !== roleId),
        ];

        setOriginalRoles(newList);
        setRoleList(newList);
      }
    } catch (error) {
      console.log('Error fetch role data to top:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setOpenAddRoleModal(true);
  };

  const handleCloseCreateModal = () => {
    setOpenAddRoleModal(false);
  };

  const handleOpenEditModal = () => {
    setOpenEditRoleModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditRoleModal(false);
  };

  const applyFilter = (status: filteType) => {
    setStatusFilter(status);

    if (status === 'all') {
      setRoleList(originalRoles);
      return;
    }

    if (status === 'active') {
      setRoleList(originalRoles.filter((role) => !role.isDeleted));
      return;
    }

    if (status === 'deleted') {
      setRoleList(originalRoles.filter((role) => role.isDeleted));
      return;
    }
  };

  console.log('Check roleList: ', roleList);

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center py-4 gap-3">
          <Input
            placeholder="Tìm theo tên vai trò..."
            value={
              (table.getColumn('roleName')?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn('roleName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />

          <DropdownFilter
            applyFilter={applyFilter}
            statusFilter={statusFilter}
          />

          <Button
            onClick={() => handleOpenCreateModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all duration-300"
          >
            + Thêm vai trò
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
                    roleId: 'ID',
                    roleName: 'Tên Vai trò',
                    directorName: 'Tên Đạo Diễn',
                    description: 'Mô tả',
                    isActive: 'Hoạt động',
                    isDeleted: 'Trạng thái xóa',
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
                    colSpan={roleColumns.length}
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
      <EditRoleModal
        open={openEditRoleModal}
        onClose={handleCloseEditModal}
        onSuccess={(newRoleId) => fetchRoleDataToTop(newRoleId)}
        roleId={editingRoleId}
      />
      <CreateRoleModal
        open={openAddRoleModal}
        onClose={handleCloseCreateModal}
        onSuccess={(newRoleId) => fetchRoleDataToTop(newRoleId)}
      />
      <ConfirmDeleteRoleModal
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setDeletingRole(null);
          setDeleteMeta(null);
        }}
        onDeleted={() => {
          setConfirmDeleteOpen(false);
          setDeletingRole(null);
          setDeleteMeta(null);
        }}
        roleId={deletingRole?.roleId ?? null}
        roleName={deletingRole?.roleName}
        userCount={deleteMeta?.userCount ?? 0}
        alternativeRoles={deleteMeta?.alternativeRoles ?? []}
        onReassignAndDelete={handleReassignAndDelete}
        onDeleteWithoutUser={handleDeleteWithoutUser}
      />
    </>
  );
}
