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
import { IBackendRes } from '@/types/backend.type';
import privateAxios from '@/lib/axios/privateAxios';

interface IRole {
  roleId: string;
  roleName: string;
}

interface CreateOrganizerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrganizerModal({
  open,
  onClose,
  onSuccess,
}: CreateOrganizerModalProps) {
  const [saving, setSaving] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [roles, setRoles] = React.useState<IRole[]>([]);

  // ── User fields ──────────────────────────────────────────────────────────
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [age, setAge] = React.useState('');
  const [roleId, setRoleId] = React.useState('');

  // ── Organizer fields ─────────────────────────────────────────────────────
  const [organizerName, setOrganizerName] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await (privateAxios.get('/roles') as unknown as Promise<
        IBackendRes<{ roles: IRole[] }>
      >);
      if (res?.EC === 1) setRoles(res.data?.roles ?? []);
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
    setOrganizerName('');
    setDescription('');
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
    if (!organizerName.trim()) {
      toast.error('Vui lòng nhập tên ban tổ chức');
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

      // Step 2: Create organizer profile
      const orgRes = await UserManagementService.CallCreateOrganizerProfile({
        userId,
        organizerName: organizerName.trim(),
        description: description.trim() || undefined,
      });

      if (orgRes?.EC === 1) {
        toast.success('Tạo ban tổ chức thành công');
        handleClose();
        onSuccess();
      } else {
        toast.error(
          orgRes?.EM ||
            'Tạo hồ sơ ban tổ chức thất bại (tài khoản đã được tạo)',
        );
      }
    } catch {
      toast.error('Lỗi khi tạo ban tổ chức');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm ban tổ chức mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Section: Tài khoản ─────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Thông tin tài khoản
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-email">Email *</Label>
                <Input
                  id="co-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-fullname">Họ tên *</Label>
                <Input
                  id="co-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-password">Mật khẩu *</Label>
                <div className="relative">
                  <Input
                    id="co-password"
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
                <Label htmlFor="co-phone">Số điện thoại *</Label>
                <Input
                  id="co-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0xxxxxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-age">Tuổi</Label>
                <Input
                  id="co-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="VD: 22"
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

          {/* ── Section: Hồ sơ ban tổ chức ────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Hồ sơ ban tổ chức
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="co-orgname">Tên ban tổ chức *</Label>
                <Input
                  id="co-orgname"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="VD: CLB Học thuật CNTT"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-desc">Mô tả</Label>
                <Textarea
                  id="co-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả về ban tổ chức (tuỳ chọn)..."
                  rows={3}
                />
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
            Tạo ban tổ chức
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
