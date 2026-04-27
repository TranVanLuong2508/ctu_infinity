'use client';

import * as React from 'react';
import { ICriteriaFramework, FrameworkStatus } from '@/types/criteria-framework.type';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, FileText } from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/formateDate';

interface FrameworkSelectorProps {
    frameworks: ICriteriaFramework[];
    selectedFramework: ICriteriaFramework | null;
    onSelectFramework: (framework: ICriteriaFramework) => void;
    isLoading?: boolean;
}

export function FrameworkSelector({
    frameworks,
    selectedFramework,
    onSelectFramework,
    isLoading = false,
}: FrameworkSelectorProps) {
    const getStatusBadge = (status: FrameworkStatus) => {
        switch (status) {
            case FrameworkStatus.ACTIVE:
                return <Badge className="bg-green-500 text-white">🟢 ACTIVE</Badge>;
            case FrameworkStatus.DRAFT:
                return <Badge className="bg-yellow-500 text-white">🟡 DRAFT</Badge>;
            case FrameworkStatus.ARCHIVED:
                return <Badge className="bg-gray-500 text-white">⚫ ARCHIVED</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Select
                value={selectedFramework?.frameworkId || ''}
                onValueChange={(value) => {
                    const framework = frameworks.find((f) => f.frameworkId === value);
                    if (framework) {
                        onSelectFramework(framework);
                    }
                }}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn khung tiêu chí">
                        {selectedFramework && (
                            <div className="flex items-center justify-between w-full">
                                <span className="font-medium">
                                    {selectedFramework.frameworkName}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {selectedFramework.version}
                                </span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {frameworks.map((framework) => (
                        <SelectItem key={framework.frameworkId} value={framework.frameworkId}>
                            <div className="flex items-center gap-2 py-1">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {framework.frameworkName}
                                        </span>
                                        {getStatusBadge(framework.status)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span>Version: {framework.version}</span>
                                        <span className="mx-2">•</span>
                                        <span>{framework.criteriaCount} tiêu chí</span>
                                    </div>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedFramework && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                            {selectedFramework.frameworkName}
                        </h3>
                        {getStatusBadge(selectedFramework.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Version: {selectedFramework.version}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Bắt đầu: {formatDate(selectedFramework.startDate)}</span>
                        </div>
                        {selectedFramework.endDate && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>Kết thúc: {formatDate(selectedFramework.endDate)}</span>
                            </div>
                        )}
                        <div className="text-gray-600">
                            <span className="font-medium">{selectedFramework.criteriaCount}</span>{' '}
                            tiêu chí
                        </div>
                    </div>

                    {selectedFramework.description && (
                        <div className="pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                {selectedFramework.description}
                            </p>
                        </div>
                    )}

                    {selectedFramework.approvedAt && (
                        <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                            Đã phê duyệt: {formatDateTime(selectedFramework.approvedAt)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
