import AdminHeader from '@/components/admin/layout/AdminHeader';
import { EventCategoriesTable } from '@/components/admin/event/EventCategoriesTable';

export default function EventCategoriesPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />
      <main className="flex-1 overflow-auto p-6">
        <EventCategoriesTable />
      </main>
    </div>
  );
}
