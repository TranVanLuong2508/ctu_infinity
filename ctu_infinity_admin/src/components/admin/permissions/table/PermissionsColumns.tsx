import { IRole } from '@/types/role.type';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils/formateDate';
import { IPermissionn } from '@/types/permission.type';

export const permisionColumns = (
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<IPermissionn>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 10,
  },
  {
    accessorKey: 'permissionId',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ID <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Tên Quyền hạn <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'apiPath',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        API Path <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="line-clamp-2 max-w-[300px]">
        {row.getValue('apiPath')}
      </div>
    ),
  },

  {
    accessorKey: 'method',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Method <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="line-clamp-2 max-w-[300px]">{row.getValue('method')}</div>
    ),
  },
  {
    accessorKey: 'module',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Module <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="line-clamp-2 max-w-[300px]">{row.getValue('module')}</div>
    ),
  },

  // {
  //   accessorKey: "isDeleted",
  //   header: ({ column }) => (
  //     <div className="w-full flex justify-center">
  //       <Button variant="ghost">Trạng thái xóa</Button>
  //     </div>
  //   ),
  //   cell: ({ row }) => {
  //     const deleted = Boolean(row.getValue("isDeleted"));

  //     return (
  //       <div className="flex justify-center">
  //         <span
  //           className={`
  //           inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border
  //           ${deleted ? "bg-red-300 text-red-800 border-red-600" : "bg-green-100 text-green-800 border-green-300"}
  //         `}
  //         >
  //           {deleted ? "Đã xoá" : "Khả dụng"}
  //         </span>
  //       </div>
  //     );
  //   },
  //   enableHiding: true,
  // },

  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Ngày tạo <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue('createdAt'))}</div>;
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <Button
        className="cursor-pointer"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Ngày chỉnh sửa <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue('updatedAt'))}</div>;
    },
  },
  {
    id: 'menu',
    enableHiding: false,
    cell: ({ row }) => {
      const permission = row.original;

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0  cursor-pointer">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                navigator.clipboard.writeText(permission.name.toString())
              }
            >
              Copy Tên quyền hạn
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onEdit(permission.permissionId)}
            >
              Chỉnh sửa
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={() => onDelete(permission.permissionId)}
            >
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
