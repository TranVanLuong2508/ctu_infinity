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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PermmissionService } from '@/services/permission.service';
import { IPermissionUpdate } from '@/types/permission.type';
import _ from 'lodash';
import { HTTP_METHODS } from '@/constants/method';

interface ModalProps {
  open: boolean;
  permissionId: string | null;
  onClose: () => void;
  onSuccess: (permissionId: string) => void;
}

export function EditPermissionModal({
  open,
  permissionId,
  onClose,
  onSuccess,
}: ModalProps) {
  const [name, setName] = useState('');
  const [apiPath, setApiPath] = useState('');
  const [module, setModule] = useState('');
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [listPermissionsModule, setListPermissionsModule] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (!permissionId || !open) return;

    const initModalEditData = async () => {
      try {
        const [perRes, detailRes] = await Promise.all([
          PermmissionService.CallFetchPermissionList(),
          PermmissionService.CallGetPermissionDetail(permissionId),
        ]);

        console.log('check detail: ', detailRes);

        if (perRes && perRes?.EC === 1) {
          setListPermissionsModule(groupByPermission(perRes.data?.permissions));
        }

        if (detailRes && detailRes?.EC === 1) {
          const permission = detailRes.data;
          setName(permission?.name ?? '');
          setApiPath(permission?.apiPath ?? '');
          setModule(permission?.module ?? '');
          setMethod(permission?.method ?? '');
        }
      } catch (error) {
        console.error('Error init edit permission modal:', error);
      }
    };

    initModalEditData();
  }, [permissionId, open]);

  const handleCloseModal = () => {
    setLoading(false);
    onClose();
    setName('');
    setApiPath('');
    setModule('');
    setMethod('');
  };

  const groupByPermission = (data: any) => {
    const groupbyPermission = _(data)
      .groupBy((x) => x.module)
      .map((value, key) => ({
        module: key,
        permissions: value,
      }))
      .value();
    const arrayModules: string[] = groupbyPermission.map((x) => x.module);
    return arrayModules;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên Quyền hạn!');
      return;
    }
    if (!apiPath.trim()) {
      toast.warning('Vui lòng nhập API Path!');
      return;
    }
    if (!module) {
      toast.warning('Vui lòng chọn Module!');
      return;
    }
    if (!method) {
      toast.warning('Vui lòng chọn HTTP Method!');
      return;
    }

    setLoading(true);
    try {
      const payload: IPermissionUpdate = {
        name: name.trim(),
        apiPath: apiPath.trim(),
        module,
        method,
      };

      const res = await PermmissionService.CallUpdatePermission(
        permissionId!,
        payload
      );

      if (res && res.EC === 1) {
        toast.success('Cập nhật Quyền hạn thành công!');
        if (res.data?.permissionId) onSuccess(res.data?.permissionId);
        handleCloseModal();
      } else {
        toast.error('Đã có lỗi xảy ra khi cập nhật permission!');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Đã có lỗi xảy ra khi cập nhật permission!');
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal} modal={true}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 hide-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Chỉnh sửa Permission
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              Tên Permission <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Lấy danh sách người dùng, Tạo vai trò mới..."
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiPath" className="text-base font-medium">
              API Path <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apiPath"
              value={apiPath}
              onChange={(e) => setApiPath(e.target.value)}
              placeholder="Ví dụ: /api/v1/users, /api/v1/roles/:id..."
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="module" className="text-base font-medium">
                Module <span className="text-red-500">*</span>
              </Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Chọn module..." />
                </SelectTrigger>
                <SelectContent>
                  {listPermissionsModule.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method" className="text-base font-medium">
                Method <span className="text-red-500">*</span>
              </Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Chọn method..." />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((httpMethod) => (
                    <SelectItem key={httpMethod} value={httpMethod}>
                      {httpMethod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              disabled={
                loading || !name.trim() || !apiPath.trim() || !module || !method
              }
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-32 cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu Quyền hạn'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
