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
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    framework: ICriteriaFramework | null;
    onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    framework,
    onConfirm,
}: DeleteConfirmDialogProps) {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!framework) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Xóa khung tiêu chí
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                Bạn có chắc muốn xóa khung <strong>{framework.frameworkName}</strong>?
                            </p>

                            <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                                <p className="text-red-900 text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Cảnh báo: Hành động không thể hoàn tác!
                                </p>
                                <ul className="text-red-800 text-sm space-y-1 list-disc list-inside">
                                    <li>
                                        Toàn bộ <strong>{framework.criteriaCount} tiêu chí</strong>{' '}
                                        trong khung này sẽ bị xóa vĩnh viễn
                                    </li>
                                    <li>Cây tiêu chí con cháu sẽ bị xóa theo (cascade delete)</li>
                                    <li>Dữ liệu không thể khôi phục sau khi xóa</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <p className="text-yellow-900 text-sm font-medium">
                                    ℹ️ Lưu ý:
                                </p>
                                <p className="text-yellow-800 text-sm mt-1">
                                    Chỉ có thể xóa khung ở trạng thái DRAFT. Khung ACTIVE hoặc
                                    ARCHIVED không thể xóa.
                                </p>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded p-3">
                                <p className="text-gray-900 text-sm">
                                    <strong>Thông tin khung sẽ xóa:</strong>
                                </p>
                                <ul className="text-gray-700 text-sm mt-1 space-y-0.5">
                                    <li>Tên: {framework.frameworkName}</li>
                                    <li>Version: {framework.version}</li>
                                    <li>Status: {framework.status}</li>
                                    <li>Số tiêu chí: {framework.criteriaCount}</li>
                                </ul>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xóa vĩnh viễn
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
