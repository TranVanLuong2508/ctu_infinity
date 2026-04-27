'use client';

import { useAuthStore } from '@/stores/authStore';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { AdminDashboard } from './_components/AdminDashboard';
import { OrganizerDashboard } from './_components/OrganizerDashboard';

export default function AdminPage() {
    const { authUser } = useAuthStore();
    const isOrganizer = authUser?.roleName === 'ORGANIZER';

    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />
            <main className="flex-1 overflow-auto p-6">
                {isOrganizer
                    ? <OrganizerDashboard userId={String(authUser?.userId ?? '')} />
                    : <AdminDashboard />
                }
            </main>
        </div>
    );
}
