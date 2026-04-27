'use client';

import * as React from 'react';
import { ICriteriaFramework, FrameworkStatus } from '@/types/criteria-framework.type';
import { Button } from '@/components/ui/button';
import {
    Edit,
    Trash2,
    CheckCircle,
    Archive,
    Copy,
    Plus,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface FrameworkManagementCardProps {
    framework: ICriteriaFramework | null;
    onEdit?: (framework: ICriteriaFramework) => void;
    onDelete?: (framework: ICriteriaFramework) => void;
    onApprove?: (framework: ICriteriaFramework) => void;
    onArchive?: (framework: ICriteriaFramework) => void;
    onClone?: (framework: ICriteriaFramework) => void;
    onCreate?: () => void;
}

export function FrameworkManagementCard({
    framework,
    onEdit,
    onDelete,
    onApprove,
    onArchive,
    onClone,
    onCreate,
}: FrameworkManagementCardProps) {
    const canEdit = framework?.status === FrameworkStatus.DRAFT;
    const canDelete = framework?.status === FrameworkStatus.DRAFT;
    const canApprove = framework?.status === FrameworkStatus.DRAFT;
    const canArchive = framework?.status === FrameworkStatus.ACTIVE;

    if (!framework) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center space-y-4">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-500">Chưa có khung tiêu chí nào</p>
                    <Button onClick={onCreate} className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo khung tiêu chí đầu tiên
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Thao tác quản lý
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {/* Create New */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onCreate}
                            className="cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Tạo mới
                        </Button>

                        {/* Edit - Only for DRAFT */}
                        {canEdit && onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(framework)}
                                className="cursor-pointer"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Chỉnh sửa
                            </Button>
                        )}

                        {/* Delete - Only for DRAFT */}
                        {canDelete && onDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(framework)}
                                className="cursor-pointer text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                            </Button>
                        )}

                        {/* Approve - Only for DRAFT */}
                        {canApprove && onApprove && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => onApprove(framework)}
                                className="cursor-pointer bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Phê duyệt
                            </Button>
                        )}

                        {/* Archive - Only for ACTIVE */}
                        {canArchive && onArchive && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onArchive(framework)}
                                className="cursor-pointer"
                            >
                                <Archive className="h-4 w-4 mr-1" />
                                Lưu trữ
                            </Button>
                        )}

                        {/* Clone - Always available */}
                        {onClone && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onClone(framework)}
                                className="cursor-pointer"
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Sao chép
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status Info */}
                <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                        {framework.status === FrameworkStatus.DRAFT && (
                            <p>
                                Khung DRAFT có thể chỉnh sửa và xóa tự do. Phê duyệt để kích
                                hoạt.
                            </p>
                        )}
                        {framework.status === FrameworkStatus.ACTIVE && (
                            <p>Khung ACTIVE đang được sử dụng. Không thể chỉnh sửa hay xóa.</p>
                        )}
                        {framework.status === FrameworkStatus.ARCHIVED && (
                            <p>
                                Khung đã lưu trữ. Chỉ xem được, không thể chỉnh sửa. Có thể sao
                                chép sang version mới.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
