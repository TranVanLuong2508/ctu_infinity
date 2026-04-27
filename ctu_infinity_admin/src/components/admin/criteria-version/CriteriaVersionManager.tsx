'use client';

import * as React from 'react';
import { ICriteriaFramework, FrameworkStatus } from '@/types/criteria-framework.type';
import { CriteriaFrameworkService } from '@/services/criteria-framework.service';
import { FrameworkSelector } from './FrameworkSelector';
import { FrameworkManagementCard } from './FrameworkManagementCard';
import { VersionedCriteriaTree } from './VersionedCriteriaTree';
import { CreateFrameworkDialog } from './dialogs/CreateFrameworkDialog';
import { CloneFrameworkDialog } from './dialogs/CloneFrameworkDialog';
import { ApproveConfirmDialog } from './dialogs/ApproveConfirmDialog';
import { DeleteConfirmDialog } from './dialogs/DeleteConfirmDialog';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CriteriaVersionManager() {
    const [frameworks, setFrameworks] = React.useState<ICriteriaFramework[]>([]);
    const [selectedFramework, setSelectedFramework] = React.useState<ICriteriaFramework | null>(
        null
    );
    const [isLoading, setIsLoading] = React.useState(true);

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = React.useState(false);
    const [showCloneDialog, setShowCloneDialog] = React.useState(false);
    const [showApproveDialog, setShowApproveDialog] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [frameworkToClone, setFrameworkToClone] = React.useState<ICriteriaFramework | null>(
        null
    );

    React.useEffect(() => {
        fetchFrameworks();
    }, []);

    const fetchFrameworks = async () => {
        setIsLoading(true);
        try {
            const res = await CriteriaFrameworkService.CallFetchFrameworks();
            console.log('Response:', res); // Debug log
            if (res?.EC === 1 && res.data) {
                // Backend returns: { data: { frameworks: [...] } }
                const frameworkList = res.data.frameworks || [];
                setFrameworks(frameworkList);

                // Auto-select framework: ACTIVE > first DRAFT > first ARCHIVED
                if (frameworkList.length > 0) {
                    const activeFramework = frameworkList.find(
                        (f) => f.status === FrameworkStatus.ACTIVE
                    );
                    const firstDraft = frameworkList.find(
                        (f) => f.status === FrameworkStatus.DRAFT
                    );
                    const toSelect = activeFramework || firstDraft || frameworkList[0];

                    // If current selected framework still exists, keep it
                    if (selectedFramework) {
                        const stillExists = frameworkList.find(
                            (f) => f.frameworkId === selectedFramework.frameworkId
                        );
                        setSelectedFramework(stillExists || toSelect);
                    } else {
                        setSelectedFramework(toSelect);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching frameworks:', error);
            toast.error('Không thể tải danh sách khung tiêu chí');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFramework = async (payload: any) => {
        try {
            const res = await CriteriaFrameworkService.CallCreateFramework(payload);
            if (res?.EC === 1 && res.data) {
                toast.success('Đã tạo khung tiêu chí mới');
                await fetchFrameworks();
                setSelectedFramework(res.data);
                setShowCreateDialog(false);
            } else {
                toast.error(res?.EM || 'Lỗi khi tạo khung tiêu chí');
            }
        } catch (error: any) {
            console.error('Create error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi tạo khung tiêu chí'
            );
        }
    };

    const handleCloneFramework = async (payload: any) => {
        if (!frameworkToClone) return;

        try {
            const res = await CriteriaFrameworkService.CallCloneFramework(
                frameworkToClone.frameworkId,
                payload
            );
            if (res?.EC === 1 && res.data) {
                toast.success(
                    `Đã sao chép khung với ${res.data.criteriaCount || 0} tiêu chí`
                );
                await fetchFrameworks();
                setShowCloneDialog(false);
                setFrameworkToClone(null);
            } else {
                toast.error(res?.EM || 'Lỗi khi sao chép khung tiêu chí');
            }
        } catch (error: any) {
            console.error('Clone error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi sao chép khung tiêu chí'
            );
        }
    };

    const handleApproveFramework = async () => {
        if (!selectedFramework) return;

        try {
            const res = await CriteriaFrameworkService.CallApproveFramework(
                selectedFramework.frameworkId
            );
            if (res?.EC === 1) {
                toast.success('Đã phê duyệt khung tiêu chí và kích hoạt');
                await fetchFrameworks();
                setShowApproveDialog(false);
            } else {
                toast.error(res?.EM || 'Lỗi khi phê duyệt khung tiêu chí');
            }
        } catch (error: any) {
            console.error('Approve error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi phê duyệt khung tiêu chí'
            );
        }
    };

    const handleArchiveFramework = async (framework: ICriteriaFramework) => {
        try {
            const res = await CriteriaFrameworkService.CallArchiveFramework(
                framework.frameworkId
            );
            if (res?.EC === 1) {
                toast.success('Đã lưu trữ khung tiêu chí');
                await fetchFrameworks();
            } else {
                toast.error(res?.EM || 'Lỗi khi lưu trữ khung tiêu chí');
            }
        } catch (error: any) {
            console.error('Archive error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi lưu trữ khung tiêu chí'
            );
        }
    };

    const handleDeleteFramework = async () => {
        if (!selectedFramework) return;

        try {
            const res = await CriteriaFrameworkService.CallDeleteFramework(
                selectedFramework.frameworkId
            );
            if (res?.EC === 1) {
                toast.success(
                    `Đã xóa khung và ${res.data?.criteriaDeleted || 0} tiêu chí`
                );
                setSelectedFramework(null);
                await fetchFrameworks();
                setShowDeleteDialog(false);
            } else {
                toast.error(res?.EM || 'Lỗi khi xóa khung tiêu chí');
            }
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi xóa khung tiêu chí'
            );
        }
    };

    const handleCloneClick = (framework: ICriteriaFramework) => {
        setFrameworkToClone(framework);
        setShowCloneDialog(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Quản lý phiên bản tiêu chí
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Quản lý các phiên bản khung tiêu chí đánh giá
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchFrameworks}
                        className="cursor-pointer"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Content - Vertical Layout */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Framework Information & Management - Top Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Framework Selector */}
                        <FrameworkSelector
                            frameworks={frameworks}
                            selectedFramework={selectedFramework}
                            onSelectFramework={setSelectedFramework}
                        />

                        {/* Framework Management Actions */}
                        <FrameworkManagementCard
                            framework={selectedFramework}
                            onCreate={() => setShowCreateDialog(true)}
                            onClone={handleCloneClick}
                            onApprove={(f) => setShowApproveDialog(true)}
                            onArchive={handleArchiveFramework}
                            onDelete={(f) => setShowDeleteDialog(true)}
                        />
                    </div>

                    {/* Criteria Tree - Bottom Section */}
                    {selectedFramework ? (
                        <VersionedCriteriaTree
                            frameworkId={selectedFramework.frameworkId}
                            frameworkStatus={selectedFramework.status}
                            onRefresh={fetchFrameworks}
                        />
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center py-20 text-gray-500">
                            <p className="text-lg">Vui lòng chọn một khung tiêu chí để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <CreateFrameworkDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSubmit={handleCreateFramework}
            />

            <CloneFrameworkDialog
                open={showCloneDialog}
                onOpenChange={setShowCloneDialog}
                sourceFramework={frameworkToClone}
                onSubmit={handleCloneFramework}
            />

            <ApproveConfirmDialog
                open={showApproveDialog}
                onOpenChange={setShowApproveDialog}
                framework={selectedFramework}
                onConfirm={handleApproveFramework}
            />

            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                framework={selectedFramework}
                onConfirm={handleDeleteFramework}
            />
        </div>
    );
}
