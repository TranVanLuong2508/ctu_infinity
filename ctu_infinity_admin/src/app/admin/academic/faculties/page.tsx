import AdminHeader from '@/components/admin/layout/AdminHeader';
import { FacultiesTable } from '@/components/admin/academic/FacultiesTable';

export default function FacultiesPage() {
    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />
            <main className="flex-1 overflow-auto p-6">
                <FacultiesTable />
            </main>
        </div>
    );
}
