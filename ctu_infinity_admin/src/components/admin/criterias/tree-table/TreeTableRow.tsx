'use client';

import * as React from 'react';
import { ICriteria } from '@/types/criteria.type';
import { InlineEditableCell } from './InlineEditableCell';
import { InlineEditableNumber } from './InlineEditableNumber';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    GripVertical,
    Loader2,
    MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface TreeTableRowProps {
    criteria: ICriteria;
    level: number;
    romanNum?: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUpdate: (criteriaId: string, field: string, value: any) => Promise<void>;
    onAddChild: (parentId: string) => void;
    onAddSibling: (criteriaId: string) => void;
    onDelete: (criteriaId: string) => Promise<void>;
    children?: React.ReactNode;
    isLoading?: boolean;
    isNew?: boolean;
    readOnly?: boolean;
}

export function TreeTableRow({
    criteria,
    level,
    romanNum,
    isExpanded,
    onToggleExpand,
    onUpdate,
    onAddChild,
    onAddSibling,
    onDelete,
    children,
    isLoading = false,
    isNew = false,
    readOnly = false,
}: TreeTableRowProps) {
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const hasChildren = criteria.children && criteria.children.length > 0;
    const indentSize = level * 24;

    // Determine if maxScore can be edited (only root or leaf)
    const canEditMaxScore = level === 1 || criteria.isLeaf;
    const maxScoreTooltip = !canEditMaxScore
        ? 'Chỉ tiêu chí gốc hoặc tiêu chí lá mới được nhập điểm'
        : '';

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(criteria.criteriaId);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div
                className="border-b border-gray-300"
                style={{
                    backgroundColor: isNew ? '#eff6ff' : 'white',
                }}
            >
                <div className="grid grid-cols-[50px_120px_1fr_100px_60px] gap-0 items-center" style={{ height: '34px' }}>
                    {/* STT */}
                    <div className="text-center text-xs border-r border-gray-200 h-full flex items-center justify-center px-1 font-semibold text-gray-600">
                        {romanNum || '-'}
                    </div>

                    {/* Criteria Code with Expand/Collapse */}
                    <div className="flex items-center gap-0.5 border-r border-gray-200 h-full px-1.5">
                        {hasChildren ? (
                            <button
                                onClick={onToggleExpand}
                                className="h-4 w-4 flex items-center justify-center hover:bg-gray-100 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                            </button>
                        ) : (
                            <div className="w-4" />
                        )}
                        <span className="font-mono text-xs">{criteria.criteriaCode}</span>
                    </div>

                    {/* Criteria Name - Inline Editable */}
                    <div className="border-r border-gray-200 h-full flex items-center" style={{ paddingLeft: `${indentSize}px` }}>
                        <InlineEditableCell
                            value={criteria.criteriaName}
                            onSave={(value) =>
                                onUpdate(criteria.criteriaId, 'criteriaName', value)
                            }
                            placeholder="Nhập tên tiêu chí..."
                            autoFocus={isNew}
                            readOnly={readOnly}
                        />
                    </div>

                    {/* Max Score - Inline Editable */}
                    <div className="border-r border-gray-200 h-full flex items-center justify-center">
                        <InlineEditableNumber
                            value={criteria.maxScore}
                            onSave={(value) => onUpdate(criteria.criteriaId, 'maxScore', value)}
                            disabled={!canEditMaxScore || readOnly}
                            errorMessage={maxScoreTooltip}
                            min={0}
                        />
                    </div>

                    {/* Actions */}
                    <div className="h-full flex items-center justify-center">
                        {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        ) : readOnly ? (
                            <span className="text-xs text-gray-400">-</span>
                        ) : (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button className="h-6 w-6 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs">
                                    <DropdownMenuItem
                                        onClick={() => onAddChild(criteria.criteriaId)}
                                        className="cursor-pointer text-xs"
                                    >
                                        <Plus className="mr-2 h-3 w-3" />
                                        Thêm tiêu chí con
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onAddSibling(criteria.criteriaId)}
                                        className="cursor-pointer text-xs"
                                    >
                                        <Plus className="mr-2 h-3 w-3" />
                                        Thêm cùng cấp
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="cursor-pointer text-red-600 text-xs"
                                    >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Xóa
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Children rows */}
                {isExpanded && children}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa tiêu chí <strong>{criteria.criteriaName}</strong>?
                            {hasChildren && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-yellow-800 text-sm font-medium">
                                        ⚠️ Tiêu chí này có {criteria.children?.length} tiêu chí con sẽ bị
                                        xóa cùng!
                                    </p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
