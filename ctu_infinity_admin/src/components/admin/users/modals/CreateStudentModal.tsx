'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { UserManagementService } from '@/services/user-management.service';
import { AcademicService } from '@/services/academic.service';
import { IBackendRes } from '@/types/backend.type';
import { IFacultyItem, IMajorItem, IClassItem } from '@/types/academic.type';
import privateAxios from '@/lib/axios/privateAxios';

interface IRole {
  roleId: string;
  roleName: string;
}

interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStudentModal({
  open,
  onClose,
  onSuccess,
}: CreateStudentModalProps) {
  const [saving, setSaving] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Lookup data
  const [roles, setRoles] = React.useState<IRole[]>([]);
  const [faculties, setFaculties] = React.useState<IFacultyItem[]>([]);
  const [allMajors, setAllMajors] = React.useState<IMajorItem[]>([]);
  const [allClasses, setAllClasses] = React.useState<IClassItem[]>([]);

  // ── User fields ──────────────────────────────────────────────────────────
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [age, setAge] = React.useState('');
  const [roleId, setRoleId] = React.useState('');

  // ── Student fields ───────────────────────────────────────────────────────
  const [studentCode, setStudentCode] = React.useState('');
  const [enrollmentYear, setEnrollmentYear] = React.useState(
    new Date().getFullYear().toString(),
  );
  const [facultyId, setFacultyId] = React.useState('');
  const [majorId, setMajorId] = React.useState('');
  const [classId, setClassId] = React.useState('');

  const filteredMajors = React.useMemo(
    () =>
      facultyId
        ? allMajors.filter((m) => m.falcultyId === facultyId)
        : allMajors,
    [allMajors, facultyId],
  );

  const filteredClasses = React.useMemo(
    () =>
      majorId ? allClasses.filter((c) => c.majorId === majorId) : allClasses,
    [allClasses, majorId],
  );

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      const [rolesRes, facRes, majRes, clsRes] = await Promise.all([
        privateAxios.get('/roles') as unknown as Promise<
          IBackendRes<{ roles: IRole[] }>
        >,
        AcademicService.CallGetAllFaculties(),
        AcademicService.CallGetAllMajors(),
        AcademicService.CallGetAllClasses(1, 500),
      ]);
      if (rolesRes?.EC === 1) setRoles(rolesRes.data?.roles ?? []);
      if (facRes?.EC === 1) setFaculties(facRes.data?.falculties ?? []);
      if (majRes?.EC === 1) setAllMajors(majRes.data?.majors ?? []);
      if (clsRes?.EC === 1) setAllClasses(clsRes.data?.classes ?? []);
    })();
  }, [open]);

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setPhoneNumber('');
    setGender('');
    setAge('');
    setRoleId('');
    setStudentCode('');
    setEnrollmentYear(new Date().getFullYear().toString());
    setFacultyId('');
    setMajorId('');
    setClassId('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (
      !email.trim() ||
      !fullName.trim() ||
      !password ||
      !phoneNumber.trim() ||
      !roleId
    ) {
      toast.error('Vui lòng điền đầy đủ thông tin người dùng (*)');
      return;
    }
    if (!studentCode.trim() || !enrollmentYear) {
      toast.error('Vui lòng điền mã sinh viên và năm nhập học');
      return;
    }
    setSaving(true);
    try {
      // Step 1: Create user
      const userRes = await UserManagementService.CallAdminCreateUser({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        gender: gender || undefined,
        age: age ? parseInt(age) : undefined,
        roleId,
      });

      if (userRes?.EC !== 1) {
        toast.error(userRes?.EM || 'Tạo tài khoản thất bại');
        return;
      }

      const userId = userRes.data?.userId;
      if (!userId) {
        toast.error('Không lấy được userId sau khi tạo');
        return;
      }

      // Step 2: Create student profile
      const studentRes = await UserManagementService.CallCreateStudentProfile({
        userId,
        studentCode: studentCode.trim(),
        enrollmentYear: parseInt(enrollmentYear),
        classId: classId || undefined,
      });

      if (studentRes?.EC === 1) {
        toast.success('Tạo sinh viên thành công');
        handleClose();
        onSuccess();
      } else {
        toast.error(
          studentRes?.EM ||
            'Tạo hồ sơ sinh viên thất bại (tài khoản đã được tạo)',
        );
      }
    } catch {
      toast.error('Lỗi khi tạo sinh viên');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sinh viên mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Section: Tài khoản ─────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Thông tin tài khoản
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cs-email">Email *</Label>
                <Input
                  id="cs-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cs-fullname">Họ tên *</Label>
                <Input
                  id="cs-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cs-password">Mật khẩu *</Label>
                <div className="relative">
                  <Input
                    id="cs-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-phone">Số điện thoại *</Label>
                <Input
                  id="cs-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0xxxxxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-age">Tuổi</Label>
                <Input
                  id="cs-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="VD: 20"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vai trò *</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò..." />
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
            </div>
          </div>

          <hr />

          {/* ── Section: Hồ sơ sinh viên ───────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Hồ sơ sinh viên
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cs-code">Mã sinh viên *</Label>
                <Input
                  id="cs-code"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="VD: B2100001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-year">Năm nhập học *</Label>
                <Input
                  id="cs-year"
                  type="number"
                  value={enrollmentYear}
                  onChange={(e) => setEnrollmentYear(e.target.value)}
                  placeholder="VD: 2021"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Khoa</Label>
                <Select
                  value={facultyId}
                  onValueChange={(v) => {
                    setFacultyId(v);
                    setMajorId('');
                    setClassId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khoa (tuỳ chọn)..." />
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
              <div className="space-y-1.5">
                <Label>Ngành</Label>
                <Select
                  value={majorId}
                  onValueChange={(v) => {
                    setMajorId(v);
                    setClassId('');
                  }}
                  disabled={!facultyId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        facultyId ? 'Chọn ngành...' : 'Chọn khoa trước'
                      }
                    />
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
              <div className="space-y-1.5">
                <Label>Lớp</Label>
                <Select
                  value={classId}
                  onValueChange={setClassId}
                  disabled={!majorId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={majorId ? 'Chọn lớp...' : 'Chọn ngành trước'}
                    />
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
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo sinh viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
