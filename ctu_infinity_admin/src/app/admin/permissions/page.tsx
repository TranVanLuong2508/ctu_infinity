'use client';

import AdminHeader from '@/components/admin/layout/AdminHeader';
import { PermissionsTable } from '@/components/admin/permissions/table/PermisisonTable';

const PermissionsPage = () => {
  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />

      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <PermissionsTable />
      </main>
    </div>
  );
};

export default PermissionsPage;
