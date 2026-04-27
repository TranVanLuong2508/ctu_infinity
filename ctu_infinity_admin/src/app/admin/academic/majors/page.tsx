import AdminHeader from '@/components/admin/layout/AdminHeader';
import { MajorsTable } from '@/components/admin/academic/MajorsTable';

export default function MajorsPage() {
    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />
            <main className="flex-1 overflow-auto p-6">
                <MajorsTable />
            </main>
        </div>
    );
}
