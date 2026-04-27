'use client';

import * as React from 'react';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { CriteriaTreeTable } from '@/components/admin/criterias/tree-table/CriteriaTreeTable';
import { ICriteriaFramework, FrameworkStatus } from '@/types/criteria-framework.type';
import { CriteriaFrameworkService } from '@/services/criteria-framework.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/utils/formateDate';

const CriteriasPage = () => {
    const [frameworks, setFrameworks] = React.useState<ICriteriaFramework[]>([]);
    const [selectedFramework, setSelectedFramework] = React.useState<ICriteriaFramework | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchFrameworks();
    }, []);

    const fetchFrameworks = async () => {
        setIsLoading(true);
        try {
            const res = await CriteriaFrameworkService.CallFetchFrameworks();
            if (res?.EC === 1 && res.data?.frameworks) {
                const frameworkList = res.data.frameworks;
                setFrameworks(frameworkList);

                // Auto-select: ACTIVE > first DRAFT > first item
                const activeFramework = frameworkList.find((f) => f.status === FrameworkStatus.ACTIVE);
                const firstDraft = frameworkList.find((f) => f.status === FrameworkStatus.DRAFT);
                const toSelect = activeFramework || firstDraft || frameworkList[0];
                setSelectedFramework(toSelect || null);
            }
        } catch (error) {
            console.error('Error fetching frameworks:', error);
            toast.error('Không thể tải danh sách khung tiêu chí');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: FrameworkStatus) => {
        switch (status) {
            case FrameworkStatus.ACTIVE:
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/15 font-medium text-xs">Đang áp dụng</Badge>;
            case FrameworkStatus.DRAFT:
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/15 font-medium text-xs">Bản nháp</Badge>;
            case FrameworkStatus.ARCHIVED:
                return <Badge className="bg-slate-500/10 text-slate-500 border-slate-200 hover:bg-slate-500/15 font-medium text-xs">Lưu trữ</Badge>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />

            <main className="flex-1 overflow-auto p-6 bg-gray-50">
                {/* Framework Selector Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Chọn khung tiêu chí để chỉnh sửa
                            </label>
                            <Select
                                value={selectedFramework?.frameworkId || ''}
                                onValueChange={(value) => {
                                    const framework = frameworks.find((f) => f.frameworkId === value);
                                    setSelectedFramework(framework || null);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn khung tiêu chí..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {frameworks.map((framework) => (
                                        <SelectItem
                                            key={framework.frameworkId}
                                            value={framework.frameworkId}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{framework.frameworkName}</span>
                                                <span className="text-gray-500">({framework.version})</span>
                                                {framework.status === FrameworkStatus.ACTIVE && (
                                                    <span className="text-green-600">✓</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedFramework && (
                            <div className="flex items-center gap-6 pt-6">
                                {getStatusBadge(selectedFramework.status)}

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(selectedFramework.startDate)}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Hash className="h-4 w-4" />
                                    {selectedFramework.criteriaCount || 0} tiêu chí
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedFramework?.status !== FrameworkStatus.DRAFT && selectedFramework && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                            ⚠️ <strong>Lưu ý:</strong> Khung này ở trạng thái{' '}
                            <strong>{selectedFramework.status}</strong> nên chỉ có thể xem, không thể chỉnh sửa.
                            {selectedFramework.status === FrameworkStatus.ACTIVE && (
                                <> Để chỉnh sửa, vui lòng sao chép sang khung mới hoặc lưu trữ khung này.</>
                            )}
                        </div>
                    )}
                </div>

                {/* Criteria Tree */}
                {selectedFramework ? (
                    <CriteriaTreeTable
                        frameworkId={selectedFramework.frameworkId}
                        frameworkStatus={selectedFramework.status}
                        onFrameworkChange={fetchFrameworks}
                    />
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                        <p className="text-lg">Vui lòng chọn một khung tiêu chí để bắt đầu</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CriteriasPage;
