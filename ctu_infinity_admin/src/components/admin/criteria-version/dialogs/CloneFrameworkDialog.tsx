'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ICloneFrameworkPayload, ICriteriaFramework } from '@/types/criteria-framework.type';
import { Loader2, Copy } from 'lucide-react';

interface CloneFrameworkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sourceFramework: ICriteriaFramework | null;
    onSubmit: (payload: ICloneFrameworkPayload) => Promise<void>;
}

export function CloneFrameworkDialog({
    open,
    onOpenChange,
    sourceFramework,
    onSubmit,
}: CloneFrameworkDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<ICloneFrameworkPayload>({
        frameworkName: '',
        version: '',
        startDate: '',
        description: '',
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (open && sourceFramework) {
            // Pre-fill form with source framework data
            setFormData({
                frameworkName: `${sourceFramework.frameworkName} (Sao chép)`,
                version: getNextVersion(sourceFramework.version),
                startDate: new Date().toISOString().split('T')[0],
                description: sourceFramework.description || '',
            });
            setErrors({});
        }
    }, [open, sourceFramework]);

    const getNextVersion = (currentVersion: string): string => {
        // Parse version like v1.0 -> v2.0
        const match = currentVersion.match(/^v(\d+)\.(\d+)$/);
        if (match) {
            const major = parseInt(match[1]);
            return `v${major + 1}.0`;
        }
        return 'v1.0';
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.frameworkName || formData.frameworkName.trim().length < 3) {
            newErrors.frameworkName = 'Tên khung phải có ít nhất 3 ký tự';
        }
        if (formData.frameworkName.trim().length > 200) {
            newErrors.frameworkName = 'Tên khung không được vượt quá 200 ký tự';
        }

        if (!formData.version) {
            newErrors.version = 'Version bắt buộc';
        } else if (!/^v\d+\.\d+$/.test(formData.version)) {
            newErrors.version = 'Version phải theo định dạng vX.Y (ví dụ: v1.0, v2.1)';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu bắt buộc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!sourceFramework) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5" />
                            Sao chép khung tiêu chí
                        </DialogTitle>
                        <DialogDescription>
                            Sao chép toàn bộ cây tiêu chí từ{' '}
                            <strong>{sourceFramework.frameworkName}</strong> sang khung mới.
                            Khung mới sẽ ở trạng thái DRAFT và có thể chỉnh sửa.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Source Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                            <p className="font-medium text-blue-900">Khung nguồn:</p>
                            <p className="text-blue-700">
                                {sourceFramework.frameworkName} ({sourceFramework.version})
                            </p>
                            <p className="text-blue-600 text-xs mt-1">
                                {sourceFramework.criteriaCount} tiêu chí sẽ được sao chép
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="frameworkName">
                                Tên khung mới <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="frameworkName"
                                value={formData.frameworkName}
                                onChange={(e) =>
                                    setFormData({ ...formData, frameworkName: e.target.value })
                                }
                                placeholder="Ví dụ: Khung ĐRL CTU 2025"
                                className={errors.frameworkName ? 'border-red-500' : ''}
                            />
                            {errors.frameworkName && (
                                <p className="text-xs text-red-500">{errors.frameworkName}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="version">
                                Version <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="version"
                                value={formData.version}
                                onChange={(e) =>
                                    setFormData({ ...formData, version: e.target.value })
                                }
                                placeholder="v2.0"
                                className={errors.version ? 'border-red-500' : ''}
                            />
                            {errors.version && (
                                <p className="text-xs text-red-500">{errors.version}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="startDate">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                className={errors.startDate ? 'border-red-500' : ''}
                            />
                            {errors.startDate && (
                                <p className="text-xs text-red-500">{errors.startDate}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Mô tả về khung tiêu chí này..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sao chép
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
