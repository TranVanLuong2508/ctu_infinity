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
import { IPermissionCreate } from '@/types/permission.type';
import { HTTP_METHODS } from '@/constants/method';
import _ from 'lodash';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (permissionId: string) => void;
}

export function CreatePermissionModal({
  open,
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
    const fetchPermissions = async () => {
      try {
        const perRes = await PermmissionService.CallFetchPermissionList();
        if (perRes && perRes?.EC === 1) {
          setListPermissionsModule(groupByPermission(perRes.data?.permissions));
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchPermissions();
  }, []);

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
      const payload: IPermissionCreate = {
        name: name.trim(),
        apiPath: apiPath.trim(),
        module,
        method,
      };
      console.log('Creating permission with payload:', payload);

      const res = await PermmissionService.CallCreatePermission(payload);

      if (res && res.EC === 1 && !_.isEmpty(res.data)) {
        toast.success('Tạo Quyền hạn thành công!');
        handleCloseModal();
        onSuccess(res.data.permissionId);
      } else {
        toast.error('Quyền hạn đã tồn tại');
      }
    } catch (error) {
      console.error('Error creating permission:', error);
      toast.error('Đã có lỗi xảy ra khi tạo permission!');
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
            Thêm Permission Mới
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
              placeholder="Ví dụ: /api/users, /api/roles/:id..."
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
