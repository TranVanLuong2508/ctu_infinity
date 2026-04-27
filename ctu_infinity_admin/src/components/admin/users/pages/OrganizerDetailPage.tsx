'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IUserManage } from '@/types/user.type';
import { UserManagementService } from '@/services/user-management.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function OrganizerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.id as string;

    const [user, setUser] = React.useState<IUserManage | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Organizer form state
    const [organizerName, setOrganizerName] = React.useState('');
    const [description, setDescription] = React.useState('');

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await UserManagementService.CallGetUserDetailWithProfile(userId);
                if (res?.EC === 1 && res.data?.user) {
                    const u = res.data.user;
                    setUser(u);
                    if (u.organizer) {
                        setOrganizerName(u.organizer.organizerName || '');
                        setDescription(u.organizer.description || '');
                    }
                } else {
                    toast.error('Không tìm thấy thông tin người dùng');
                }
            } catch (error) {
                toast.error('Lỗi khi tải thông tin');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchUser();
    }, [userId]);

    const handleSave = async () => {
        if (!user?.organizer) {
            toast.error('Không tìm thấy hồ sơ ban tổ chức');
            return;
        }

        setSaving(true);
        try {
            const res = await UserManagementService.CallUpdateOrganizerProfile(
                user.organizer.organizerId,
                { organizerName, description },
            );

            if (res?.EC === 1) {
                toast.success('Cập nhật hồ sơ ban tổ chức thành công');
            } else {
                toast.error(res?.EM || 'Cập nhật thất bại');
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật hồ sơ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user || !user.organizer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-muted-foreground">Không tìm thấy hồ sơ ban tổ chức</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="cursor-pointer">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
                </Button>
                <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-purple-600" />
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Ban tổ chức</h1>
                        <p className="text-sm text-muted-foreground">{user.fullName} — {user.email}</p>
                    </div>
                </div>
            </div>

            {/* User info summary (readonly) */}
            <Card className="bg-muted/40">
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Họ tên:</span><br /><strong>{user.fullName}</strong></div>
                        <div><span className="text-muted-foreground">Email:</span><br /><strong>{user.email}</strong></div>
                        <div><span className="text-muted-foreground">SĐT:</span><br /><strong>{user.phoneNumber || '—'}</strong></div>
                        <div><span className="text-muted-foreground">Giới tính:</span><br /><strong>{user.gender || '—'}</strong></div>
                    </div>
                </CardContent>
            </Card>

            {/* Organizer form */}
            <Card>
                <CardHeader>
                    <CardTitle>Hồ sơ Ban tổ chức</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="organizerName">Tên ban tổ chức</Label>
                        <Input
                            id="organizerName"
                            value={organizerName}
                            onChange={(e) => setOrganizerName(e.target.value)}
                            placeholder="Nhập tên ban tổ chức..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả về ban tổ chức..."
                            rows={5}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Lưu thay đổi
                </Button>
            </div>
        </div>
        </div>
    );
}
