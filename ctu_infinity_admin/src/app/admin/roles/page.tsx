'use client';

import AdminHeader from '@/components/admin/layout/AdminHeader';
import { RolesTable } from '@/components/admin/roles/table/RolesTable';

const RolesPage = () => {
  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />

      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <RolesTable />
      </main>
    </div>
  );
};

export default RolesPage;
