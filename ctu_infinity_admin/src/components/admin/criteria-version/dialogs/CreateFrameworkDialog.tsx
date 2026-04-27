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
import { ICreateFrameworkPayload } from '@/types/criteria-framework.type';
import { Loader2 } from 'lucide-react';

interface CreateFrameworkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: ICreateFrameworkPayload) => Promise<void>;
}

export function CreateFrameworkDialog({
    open,
    onOpenChange,
    onSubmit,
}: CreateFrameworkDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<ICreateFrameworkPayload>({
        frameworkName: '',
        version: '',
        startDate: '',
        description: '',
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (open) {
            // Reset form when dialog opens
            setFormData({
                frameworkName: '',
                version: '',
                startDate: new Date().toISOString().split('T')[0],
                description: '',
            });
            setErrors({});
        }
    }, [open]);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Tạo khung tiêu chí mới</DialogTitle>
                        <DialogDescription>
                            Khung mới sẽ được tạo ở trạng thái DRAFT. Bạn có thể thêm tiêu chí và chỉnh sửa trước khi phê duyệt.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="frameworkName">
                                Tên khung <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="frameworkName"
                                value={formData.frameworkName}
                                onChange={(e) =>
                                    setFormData({ ...formData, frameworkName: e.target.value })
                                }
                                placeholder="Ví dụ: Khung ĐRL CTU 2024"
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
                                placeholder="v1.0"
                                className={errors.version ? 'border-red-500' : ''}
                            />
                            {errors.version && (
                                <p className="text-xs text-red-500">{errors.version}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Định dạng: vX.Y (ví dụ: v1.0, v2.1)
                            </p>
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
                            Tạo mới
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
