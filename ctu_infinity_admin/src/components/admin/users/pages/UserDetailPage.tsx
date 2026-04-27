'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IUserManage } from '@/types/user.type';
import { UserManagementService } from '@/services/user-management.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

interface IRole {
    roleId: string;
    roleName: string;
}

interface IRolesRes {
    roles: IRole[];
}

export function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.id as string;

    const [user, setUser] = React.useState<IUserManage | null>(null);
    const [roles, setRoles] = React.useState<IRole[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Form state
    const [fullName, setFullName] = React.useState('');
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [gender, setGender] = React.useState('');
    const [birthDate, setBirthDate] = React.useState('');
    const [age, setAge] = React.useState('');
    const [roleId, setRoleId] = React.useState('');

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, rolesRes] = await Promise.all([
                    UserManagementService.CallGetUserDetailWithProfile(userId),
                    privateAxios.get('/roles') as unknown as IBackendRes<IRolesRes>,
                ]);

                if (userRes?.EC === 1 && userRes.data?.user) {
                    const u = userRes.data.user;
                    setUser(u);
                    setFullName(u.fullName || '');
                    setPhoneNumber(u.phoneNumber || '');
                    setGender(u.gender || '');
                    setBirthDate(u.birthDate ? u.birthDate.split('T')[0] : '');
                    setAge(u.age?.toString() || '');
                    setRoleId(u.roleId || '');
                }

                if (rolesRes?.EC === 1 && (rolesRes.data as IRolesRes)?.roles) {
                    setRoles((rolesRes.data as IRolesRes).roles);
                }
            } catch (error) {
                toast.error('Lỗi khi tải thông tin người dùng');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchData();
    }, [userId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await UserManagementService.CallUpdateUserBasicInfo(userId, {
                fullName,
                phoneNumber,
                gender,
                birthDate: birthDate || undefined,
                age: age ? parseInt(age) : undefined,
                roleId,
            });

            if (res?.EC === 1) {
                toast.success('Cập nhật thông tin thành công');
            } else {
                toast.error(res?.EM || 'Cập nhật thất bại');
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật thông tin');
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

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-muted-foreground">Không tìm thấy người dùng</p>
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
                <div>
                    <h1 className="text-2xl font-bold">Thông tin người dùng</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge
                    className="ml-auto"
                    variant={
                        user.accountType === 'STUDENT'
                            ? 'default'
                            : user.accountType === 'ORGANIZER'
                                ? 'secondary'
                                : 'outline'
                    }
                >
                    {user.accountType === 'STUDENT'
                        ? 'Sinh viên'
                        : user.accountType === 'ORGANIZER'
                            ? 'Ban tổ chức'
                            : 'Người dùng'}
                </Badge>
            </div>

            {/* Form card */}
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email (readonly) */}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label>Email</Label>
                        <Input value={user.email} disabled className="bg-muted" />
                    </div>

                    {/* Full name */}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nhập họ tên..."
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <Label htmlFor="phoneNumber">Số điện thoại</Label>
                        <Input
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="0xxx..."
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <Label htmlFor="gender">Giới tính</Label>
                        <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Nam</SelectItem>
                                <SelectItem value="female">Nữ</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Birth date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="birthDate">Ngày sinh</Label>
                        <Input
                            id="birthDate"
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                        />
                    </div>

                    {/* Age */}
                    <div className="space-y-1.5">
                        <Label htmlFor="age">Tuổi</Label>
                        <Input
                            id="age"
                            type="number"
                            min={1}
                            max={120}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Nhập tuổi..."
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="role">Vai trò</Label>
                        <Select value={roleId} onValueChange={setRoleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.roleId} value={r.roleId}>
                                        {r.roleName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Action links for profile management */}
            {user.accountType === 'STUDENT' && (
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium">Hồ sơ sinh viên</p>
                            <p className="text-sm text-muted-foreground">
                                Mã SV: {user.student?.studentCode || '—'} | Lớp:{' '}
                                {user.student?.class?.className || '—'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/users/${userId}/student`)}
                        >
                            Quản lý hồ sơ sinh viên →
                        </Button>
                    </CardContent>
                </Card>
            )}

            {user.accountType === 'ORGANIZER' && (
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium">Hồ sơ ban tổ chức</p>
                            <p className="text-sm text-muted-foreground">
                                Tên: {user.organizer?.organizerName || '—'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/users/${userId}/organizer`)}
                        >
                            Quản lý hồ sơ ban tổ chức →
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Save button */}
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
