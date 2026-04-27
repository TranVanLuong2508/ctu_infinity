'use client';

import * as React from 'react';
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
import { IBackendRes } from '@/types/backend.type';
import privateAxios from '@/lib/axios/privateAxios';

interface IRole {
  roleId: string;
  roleName: string;
}

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({
  open,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const [roles, setRoles] = React.useState<IRole[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Form fields
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [age, setAge] = React.useState('');
  const [roleId, setRoleId] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await (privateAxios.get('/roles') as unknown as Promise<
          IBackendRes<{ roles: IRole[] }>
        >);
        if (res?.EC === 1) setRoles(res.data?.roles ?? []);
      } catch {
        // silently ignore
      }
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
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const res = await UserManagementService.CallAdminCreateUser({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        gender: gender || undefined,
        age: age ? parseInt(age) : undefined,
        roleId,
      });
      if (res?.EC === 1) {
        toast.success('Tạo người dùng thành công');
        handleClose();
        onSuccess();
      } else {
        toast.error(res?.EM || 'Tạo người dùng thất bại');
      }
    } catch {
      toast.error('Lỗi khi tạo người dùng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo người dùng mới</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Email */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cu-email">Email *</Label>
            <Input
              id="cu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cu-fullname">Họ tên *</Label>
            <Input
              id="cu-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cu-password">Mật khẩu *</Label>
            <div className="relative">
              <Input
                id="cu-password"
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

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="cu-phone">Số điện thoại *</Label>
            <Input
              id="cu-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0xxxxxxxxx"
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label htmlFor="cu-age">Tuổi</Label>
            <Input
              id="cu-age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="VD: 20"
            />
          </div>

          {/* Gender */}
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

          {/* Role */}
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
            Tạo người dùng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
