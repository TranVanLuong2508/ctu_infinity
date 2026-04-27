'use client';

import AdminHeader from '@/components/admin/layout/AdminHeader';
import { CriteriaVersionManager } from '@/components/admin/criteria-version/CriteriaVersionManager';

const CriteriaVersionManagementPage = () => {
    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />
            <CriteriaVersionManager />
        </div>
    );
};

export default CriteriaVersionManagementPage;
