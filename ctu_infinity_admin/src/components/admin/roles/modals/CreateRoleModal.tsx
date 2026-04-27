// CreateRoleModal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { RoleService } from '@/services/role.service';
import { ModalRoleData } from '@/types/role.type';
import { toast } from 'sonner';
import { ROLE_MESSAGES } from '@/constants/messages/roleMessage';
import { PermissionModule } from '@/types/permission.type';
import _ from 'lodash';
import { PermmissionService } from '@/services/permission.service';
import '../../../../styles/RoleModal.css';
import PermissionSelectorEdit from '../PermissionSelectorEdit';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (roleId: string) => void;
}

export function CreateRoleModal({ open, onClose, onSuccess }: ModalProps) {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [listPermissions, setListPermissions] = useState<
    PermissionModule[] | null
  >(null);

  useEffect(() => {
    const init = async () => {
      const res = await PermmissionService.CallFetchPermissionList();
      if (res && res.EC === 1) {
        setListPermissions(groupByPermission(res.data?.permissions));
      }
    };
    init();
  }, []);

  const groupByPermission = (data: any) => {
    return _(data)
      .groupBy((x) => x.module)
      .map((value, key) => ({
        module: key,
        permissions: value,
      }))
      .value();
  };

  const handleCloseModal = () => {
    setSelectedPermissions([]);
    setLoading(false);
    onClose();
    setRoleName('');
    setDescription('');
    setIsActive(true);
  };

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast.warning(ROLE_MESSAGES.emptyRole);
      return;
    }
    if (!description.trim()) {
      toast.error(ROLE_MESSAGES.emptyDes);
      return;
    }

    setLoading(true);
    try {
      const payload: ModalRoleData = {
        roleName: roleName.trim(),
        description: description.trim(),
        isActive,
        permissionIds: selectedPermissions,
      };

      const createRoleResponse = await RoleService.CallCreateRole(payload);

      if (createRoleResponse?.EC === 1) {
        toast.success(ROLE_MESSAGES.createSucess || 'Tạo vai trò thành công!');
        if (createRoleResponse.data?.roleId)
          onSuccess(createRoleResponse.data?.roleId);
        handleCloseModal();
      } else if (createRoleResponse?.EC === 2) {
        toast.warning(ROLE_MESSAGES.alreadyExist || 'Tên vai trò đã tồn tại!');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal} modal={true}>
      <DialogContent className=" max-w-[95vw] w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 hide-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Thêm vai trò mới
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="roleName" className="text-base font-medium">
                Tên vai trò <span className="text-red-500">*</span>
              </Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Ví dụ: Quản trị viên, Biên tập viên..."
                className="h-11"
              />
            </div>

            <div className="flex items-end justify-start gap-4">
              <div className="space-y-2 flex-1">
                <Label className="text-base font-medium">Trạng thái</Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-blue-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium">
                    {isActive ? 'Active' : 'InActive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Mô tả <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết về vai trò này..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <PermissionSelectorEdit
              listPermissions={listPermissions}
              value={selectedPermissions}
              onChange={(data) => setSelectedPermissions(data)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={handleCloseModal}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !roleName.trim() || !description.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-32 cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu vai trò'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
