import AdminHeader from '@/components/admin/layout/AdminHeader';
import { ClassesTable } from '@/components/admin/academic/ClassesTable';

export default function ClassesPage() {
    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />
            <main className="flex-1 overflow-auto p-6">
                <ClassesTable />
            </main>
        </div>
    );
}
