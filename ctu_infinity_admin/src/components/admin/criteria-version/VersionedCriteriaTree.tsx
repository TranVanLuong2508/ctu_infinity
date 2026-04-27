'use client';

import * as React from 'react';
import { ICriteria } from '@/types/criteria.type';
import { FrameworkStatus } from '@/types/criteria-framework.type';
import { CriteriaService } from '@/services/criteria.service';
import { TreeTableRow } from '../criterias/tree-table/TreeTableRow';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface VersionedCriteriaTreeProps {
    frameworkId: string;
    frameworkStatus: FrameworkStatus;
    onRefresh?: () => void;
}

export function VersionedCriteriaTree({
    frameworkId,
    frameworkStatus,
    onRefresh,
}: VersionedCriteriaTreeProps) {
    const [criteriaTree, setCriteriaTree] = React.useState<ICriteria[]>([]);
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
    const [loadingIds, setLoadingIds] = React.useState<Set<string>>(new Set());
    const [newRows, setNewRows] = React.useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = React.useState(true);

    const isReadOnly = frameworkStatus !== FrameworkStatus.DRAFT;

    React.useEffect(() => {
        fetchCriteriaTree();
    }, [frameworkId]);

    const fetchCriteriaTree = async () => {
        setIsLoading(true);
        try {
            const res = await CriteriaService.CallFetchCriteriaTree(frameworkId);
            if (res?.EC === 1 && res.data?.tree) {
                setCriteriaTree(res.data.tree);
                // Auto-expand all by default
                const allIds = getAllCriteriaIds(res.data.tree);
                setExpandedIds(new Set(allIds));
            }
        } catch (error) {
            console.error('Error fetching criteria:', error);
            toast.error('Không thể tải danh sách tiêu chí');
        } finally {
            setIsLoading(false);
        }
    };

    const getAllCriteriaIds = (tree: ICriteria[]): string[] => {
        const ids: string[] = [];
        const traverse = (items: ICriteria[]) => {
            items.forEach((item) => {
                ids.push(item.criteriaId);
                if (item.children && item.children.length > 0) {
                    traverse(item.children);
                }
            });
        };
        traverse(tree);
        return ids;
    };

    const toggleExpand = (criteriaId: string) => {
        setExpandedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(criteriaId)) {
                newSet.delete(criteriaId);
            } else {
                newSet.add(criteriaId);
            }
            return newSet;
        });
    };

    const handleUpdate = async (criteriaId: string, field: string, value: any) => {
        if (isReadOnly) {
            toast.error('Không thể chỉnh sửa tiêu chí trong khung không phải DRAFT');
            throw new Error('Cannot modify non-DRAFT framework');
        }

        setLoadingIds((prev) => new Set(prev).add(criteriaId));

        try {
            const payload: any = {};
            payload[field] = value;

            const res = await CriteriaService.CallUpdateCriteria(criteriaId, payload);

            if (res?.EC === 1) {
                // Optimistic update
                const updateTree = (items: ICriteria[]): ICriteria[] => {
                    return items.map((item) => {
                        if (item.criteriaId === criteriaId) {
                            return { ...item, [field]: value };
                        }
                        if (item.children) {
                            return { ...item, children: updateTree(item.children) };
                        }
                        return item;
                    });
                };

                setCriteriaTree((prev) => updateTree(prev));

                // Remove from new rows if it was new
                setNewRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(criteriaId);
                    return newSet;
                });

                toast.success('Đã cập nhật');
            } else {
                toast.error(res?.EM || 'Lỗi khi cập nhật');
                throw new Error(res?.EM);
            }
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error?.response?.data?.EM || error?.message || 'Lỗi khi cập nhật');
            throw error;
        } finally {
            setLoadingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(criteriaId);
                return newSet;
            });
        }
    };

    const handleAddChild = async (parentId: string) => {
        if (isReadOnly) {
            toast.error('Không thể thêm tiêu chí vào khung không phải DRAFT');
            return;
        }

        try {
            const timestamp = Date.now().toString().slice(-6);
            const payload = {
                criteriaName: `Tiêu chí mới ${timestamp}`,
                parentId: parentId,
                frameworkId: frameworkId,
            };

            const res = await CriteriaService.CallCreateCriteria(payload);

            if (res?.EC === 1 && res.data?.criteriaId) {
                await fetchCriteriaTree();
                setNewRows((prev) => new Set(prev).add(res.data!.criteriaId));
                setExpandedIds((prev) => new Set(prev).add(parentId));
                toast.success('Đã thêm tiêu chí con');
                onRefresh?.();
            } else {
                toast.error(res?.EM || 'Lỗi khi thêm tiêu chí');
            }
        } catch (error: any) {
            console.error('Add child error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi thêm tiêu chí'
            );
        }
    };

    const handleAddSibling = async (criteriaId: string) => {
        if (isReadOnly) {
            toast.error('Không thể thêm tiêu chí vào khung không phải DRAFT');
            return;
        }

        const findCriteria = (
            items: ICriteria[],
            id: string,
            parent: string | null = null
        ): { criteria: ICriteria | null; parentId: string | null } => {
            for (const item of items) {
                if (item.criteriaId === id) {
                    return { criteria: item, parentId: parent };
                }
                if (item.children) {
                    const result = findCriteria(item.children, id, item.criteriaId);
                    if (result.criteria) return result;
                }
            }
            return { criteria: null, parentId: null };
        };

        const { criteria, parentId } = findCriteria(criteriaTree, criteriaId);

        if (!criteria) return;

        try {
            const timestamp = Date.now().toString().slice(-6);
            const payload = {
                criteriaName: `Tiêu chí mới ${timestamp}`,
                parentId: parentId || undefined,
                frameworkId: frameworkId,
            };

            const res = await CriteriaService.CallCreateCriteria(payload);

            if (res?.EC === 1 && res.data?.criteriaId) {
                await fetchCriteriaTree();
                setNewRows((prev) => new Set(prev).add(res.data!.criteriaId));
                toast.success('Đã thêm tiêu chí cùng cấp');
                onRefresh?.();
            } else {
                toast.error(res?.EM || 'Lỗi khi thêm tiêu chí');
            }
        } catch (error: any) {
            console.error('Add sibling error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi thêm tiêu chí'
            );
        }
    };

    const handleDelete = async (criteriaId: string) => {
        if (isReadOnly) {
            toast.error('Không thể xóa tiêu chí trong khung không phải DRAFT');
            throw new Error('Cannot delete from non-DRAFT framework');
        }

        try {
            const res = await CriteriaService.CallDeleteCriteria(criteriaId);

            if (res?.EC === 1) {
                await fetchCriteriaTree();
                toast.success(`Đã xóa ${res.data?.totalDeleted || 1} tiêu chí`);
                onRefresh?.();
            } else {
                toast.error(res?.EM || 'Lỗi khi xóa');
                throw new Error(res?.EM);
            }
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error?.response?.data?.EM || error?.message || 'Lỗi khi xóa');
            throw error;
        }
    };

    const handleAddRootCriteria = async () => {
        if (isReadOnly) {
            toast.error('Không thể thêm tiêu chí vào khung không phải DRAFT');
            return;
        }

        try {
            const timestamp = Date.now().toString().slice(-6);
            const payload = {
                criteriaName: `Tiêu chí gốc mới ${timestamp}`,
                maxScore: 20,
                frameworkId: frameworkId,
            };

            const res = await CriteriaService.CallCreateCriteria(payload);

            if (res?.EC === 1 && res.data?.criteriaId) {
                await fetchCriteriaTree();
                setNewRows((prev) => new Set(prev).add(res.data!.criteriaId));
                toast.success('Đã thêm tiêu chí gốc');
                onRefresh?.();
            } else {
                toast.error(res?.EM || 'Lỗi khi thêm tiêu chí');
            }
        } catch (error: any) {
            console.error('Add root error:', error);
            toast.error(
                error?.response?.data?.EM || error?.message || 'Lỗi khi thêm tiêu chí'
            );
        }
    };

    const renderCriteriaTree = (items: ICriteria[], level: number = 1): React.ReactNode => {
        return items.map((criteria) => {
            const isExpanded = expandedIds.has(criteria.criteriaId);
            const isRowLoading = loadingIds.has(criteria.criteriaId);
            const isNew = newRows.has(criteria.criteriaId);

            return (
                <TreeTableRow
                    key={criteria.criteriaId}
                    criteria={criteria}
                    level={level}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(criteria.criteriaId)}
                    onUpdate={handleUpdate}
                    onAddChild={handleAddChild}
                    onAddSibling={handleAddSibling}
                    onDelete={handleDelete}
                    isLoading={isRowLoading}
                    isNew={isNew}
                    readOnly={isReadOnly}
                >
                    {criteria.children &&
                        criteria.children.length > 0 &&
                        isExpanded &&
                        renderCriteriaTree(criteria.children, level + 1)}
                </TreeTableRow>
            );
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Cây tiêu chí</h2>
                    {isReadOnly && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            <Lock className="h-3 w-3" />
                            <span>Chỉ xem</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            fetchCriteriaTree();
                            onRefresh?.();
                        }}
                        className="cursor-pointer"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                    {!isReadOnly && (
                        <Button onClick={handleAddRootCriteria} className="cursor-pointer">
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm tiêu chí gốc
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div
                className="border border-gray-300 bg-white overflow-auto"
                style={{ maxHeight: 'calc(100vh - 400px)' }}
            >
                {/* Sticky Header */}
                <div
                    className="grid grid-cols-[50px_120px_1fr_100px_60px] gap-0 bg-gray-50 border-b-2 border-gray-400 sticky top-0 z-10"
                    style={{ height: '32px' }}
                >
                    <div className="text-center text-xs font-semibold border-r border-gray-300 flex items-center justify-center">
                        STT
                    </div>
                    <div className="text-xs font-semibold border-r border-gray-300 flex items-center px-1.5">
                        Mã tiêu chí
                    </div>
                    <div className="text-xs font-semibold border-r border-gray-300 flex items-center px-1.5">
                        Tên tiêu chí
                    </div>
                    <div className="text-center text-xs font-semibold border-r border-gray-300 flex items-center justify-center">
                        Điểm tối đa
                    </div>
                    <div className="text-center text-xs font-semibold flex items-center justify-center">
                        Actions
                    </div>
                </div>

                {/* Table Body */}
                <div>
                    {criteriaTree.length > 0 ? (
                        renderCriteriaTree(criteriaTree)
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>Chưa có tiêu chí nào</p>
                            {!isReadOnly && (
                                <Button
                                    variant="outline"
                                    className="mt-4 cursor-pointer"
                                    onClick={handleAddRootCriteria}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm tiêu chí đầu tiên
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="text-sm text-gray-500 space-y-1">
                {!isReadOnly ? (
                    <>
                        <p>Click vào ô để chỉnh sửa trực tiếp</p>
                        <p>
                            Enter để lưu, Esc để hủy - Chỉ tiêu chí gốc và tiêu chí lá mới được
                            nhập điểm
                        </p>
                    </>
                ) : (
                    <p>
                        Khung tiêu chí đang ở chế độ chỉ xem. Chỉ có thể chỉnh sửa khi khung ở
                        trạng thái DRAFT.
                    </p>
                )}
            </div>
        </div>
    );
}
