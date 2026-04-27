'use client';

import * as React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ICriteriaFramework } from '@/types/criteria-framework.type';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/formateDate';

interface ApproveConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    framework: ICriteriaFramework | null;
    onConfirm: () => Promise<void>;
}

export function ApproveConfirmDialog({
    open,
    onOpenChange,
    framework,
    onConfirm,
}: ApproveConfirmDialogProps) {
    const [isConfirming, setIsConfirming] = React.useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } finally {
            setIsConfirming(false);
        }
    };

    if (!framework) return null;

    const hasNoCriteria = framework.criteriaCount === 0;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Phê duyệt khung tiêu chí
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                Bạn có chắc muốn phê duyệt khung{' '}
                                <strong>{framework.frameworkName}</strong>?
                            </p>

                            {hasNoCriteria ? (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Không thể phê duyệt
                                    </p>
                                    <p className="text-red-700 text-sm mt-1">
                                        Khung tiêu chí phải có ít nhất một tiêu chí gốc trước khi
                                        phê duyệt.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2">
                                    <p className="text-yellow-900 text-sm font-medium">
                                        ⚠️ Tác động:
                                    </p>
                                    <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
                                        <li>
                                            Khung này sẽ chuyển sang trạng thái ACTIVE và được sử
                                            dụng ngay lập tức
                                        </li>
                                        <li>
                                            Khung ACTIVE hiện tại (nếu có) sẽ tự động chuyển sang
                                            ARCHIVED
                                        </li>
                                        <li>
                                            Sau khi phê duyệt, không thể chỉnh sửa hay xóa khung
                                            này
                                        </li>
                                        <li>Chỉ khung ACTIVE mới có thể được lưu trữ thủ công</li>
                                    </ul>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <p className="text-blue-900 text-sm">
                                    <strong>Thông tin khung:</strong>
                                </p>
                                <ul className="text-blue-700 text-sm mt-1 space-y-0.5">
                                    <li>Tên: {framework.frameworkName}</li>
                                    <li>Version: {framework.version}</li>
                                    <li>Số tiêu chí: {framework.criteriaCount}</li>
                                    <li>
                                        Ngày bắt đầu:{' '}
                                        {formatDateTime(framework.startDate)}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isConfirming}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isConfirming || hasNoCriteria}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Phê duyệt
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
