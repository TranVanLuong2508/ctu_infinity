'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IUserManage, IClass, IMajor, IFaculty } from '@/types/user.type';
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
import { ArrowLeft, Save, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.id as string;

    const [user, setUser] = React.useState<IUserManage | null>(null);
    const [faculties, setFaculties] = React.useState<IFaculty[]>([]);
    const [majors, setMajors] = React.useState<IMajor[]>([]);
    const [classes, setClasses] = React.useState<IClass[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Student form state
    const [studentCode, setStudentCode] = React.useState('');
    const [enrollmentYear, setEnrollmentYear] = React.useState('');
    const [selectedFacultyId, setSelectedFacultyId] = React.useState('');
    const [selectedMajorId, setSelectedMajorId] = React.useState('');
    const [selectedClassId, setSelectedClassId] = React.useState('');

    // Cascaded filtered lists
    const filteredMajors = React.useMemo(
        () => majors.filter((m) => m.falculty?.falcultyId === selectedFacultyId || !selectedFacultyId),
        [majors, selectedFacultyId],
    );

    const filteredClasses = React.useMemo(
        () => classes.filter((c) => c.major?.majorId === selectedMajorId || !selectedMajorId),
        [classes, selectedMajorId],
    );

    React.useEffect(() => {
        const fetchAll = async () => {
            try {
                const [userRes, facultiesRes, majorsRes, classesRes] = await Promise.all([
                    UserManagementService.CallGetUserDetailWithProfile(userId),
                    privateAxios.get('/falculties') as unknown as IBackendRes<{ falculties: IFaculty[] }>,
                    privateAxios.get('/majors') as unknown as IBackendRes<{ majors: IMajor[] }>,
                    privateAxios.get('/class') as unknown as IBackendRes<{ classes: IClass[] }>,
                ]);

                if (userRes?.EC === 1 && userRes.data?.user) {
                    const u = userRes.data.user;
                    setUser(u);

                    if (u.student) {
                        setStudentCode(u.student.studentCode || '');
                        setEnrollmentYear(u.student.enrollmentYear?.toString() || '');
                        setSelectedClassId(u.student.classId || '');

                        const cls = u.student.class;
                        if (cls?.major?.majorId) {
                            setSelectedMajorId(cls.major.majorId);
                            if (cls.major.falculty?.falcultyId) {
                                setSelectedFacultyId(cls.major.falculty.falcultyId);
                            }
                        }
                    }
                }

                if (facultiesRes?.EC === 1) {
                    setFaculties(facultiesRes.data?.falculties ?? []);
                }
                if (majorsRes?.EC === 1) {
                    setMajors(majorsRes.data?.majors ?? []);
                }
                if (classesRes?.EC === 1) {
                    setClasses(classesRes.data?.classes ?? []);
                }
            } catch (error) {
                toast.error('Lỗi khi tải thông tin');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchAll();
    }, [userId]);

    // Reset majors/classes when faculty changes
    const handleFacultyChange = (fid: string) => {
        setSelectedFacultyId(fid);
        setSelectedMajorId('');
        setSelectedClassId('');
    };

    const handleMajorChange = (mid: string) => {
        setSelectedMajorId(mid);
        setSelectedClassId('');
    };

    const handleSave = async () => {
        if (!user?.student) {
            toast.error('Không tìm thấy hồ sơ sinh viên');
            return;
        }

        setSaving(true);
        try {
            const res = await UserManagementService.CallUpdateStudentProfile(
                user.student.studentId,
                {
                    studentCode,
                    enrollmentYear: enrollmentYear ? parseInt(enrollmentYear) : undefined,
                    classId: selectedClassId || undefined,
                },
            );

            if (res?.EC === 1) {
                toast.success('Cập nhật hồ sơ sinh viên thành công');
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

    if (!user || !user.student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-muted-foreground">Không tìm thấy hồ sơ sinh viên</p>
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
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Sinh viên</h1>
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

            {/* Student form */}
            <Card>
                <CardHeader>
                    <CardTitle>Hồ sơ sinh viên</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="studentCode">Mã sinh viên</Label>
                        <Input
                            id="studentCode"
                            value={studentCode}
                            onChange={(e) => setStudentCode(e.target.value)}
                            placeholder="VD: B2100001"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="enrollmentYear">Năm nhập học</Label>
                        <Input
                            id="enrollmentYear"
                            type="number"
                            value={enrollmentYear}
                            onChange={(e) => setEnrollmentYear(e.target.value)}
                            placeholder="VD: 2021"
                        />
                    </div>

                    {/* Faculty */}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label>Khoa</Label>
                        <Select value={selectedFacultyId} onValueChange={handleFacultyChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn khoa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {faculties.map((f) => (
                                    <SelectItem key={f.falcultyId} value={f.falcultyId}>
                                        {f.falcultyName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Major */}
                    <div className="space-y-1.5">
                        <Label>Ngành</Label>
                        <Select
                            value={selectedMajorId}
                            onValueChange={handleMajorChange}
                            disabled={!selectedFacultyId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedFacultyId ? 'Chọn ngành...' : 'Chọn khoa trước'} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredMajors.map((m) => (
                                    <SelectItem key={m.majorId} value={m.majorId}>
                                        {m.majorName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Class */}
                    <div className="space-y-1.5">
                        <Label>Lớp</Label>
                        <Select
                            value={selectedClassId}
                            onValueChange={setSelectedClassId}
                            disabled={!selectedMajorId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedMajorId ? 'Chọn lớp...' : 'Chọn ngành trước'} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredClasses.map((c) => (
                                    <SelectItem key={c.classId} value={c.classId}>
                                        {c.className}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
