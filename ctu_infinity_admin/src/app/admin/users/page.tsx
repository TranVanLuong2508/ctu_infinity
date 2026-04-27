'use client';

import * as React from 'react';
import { UsersManageTable } from '@/components/admin/users/table/UsersManageTable';
import { CreateUserModal } from '@/components/admin/users/modals/CreateUserModal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default function UsersPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-end mb-6">
          <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-2">
            <UserPlus className="h-4 w-4" /> Tạo người dùng
          </Button>
        </div>

        <UsersManageTable key={refreshKey} />

        <CreateUserModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); setRefreshKey((k) => k + 1); }}
        />
      </main>
    </div>
  );
}
