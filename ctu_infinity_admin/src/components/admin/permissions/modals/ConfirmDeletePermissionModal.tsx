'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { PermmissionService } from '@/services/permission.service';
import { IPermissionn } from '@/types/permission.type';
import _ from 'lodash';

interface ConfirmDeletePermissionModalProps {
  open: boolean;
  onClose: () => void;
  permission: IPermissionn | null;
  onSuccess: (permissionId: string) => void;
}

export function ConfirmDeletePermissionModal({
  open,
  onClose,
  permission,
  onSuccess,
}: ConfirmDeletePermissionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!permission) return;

    setLoading(true);
    try {
      const res = await PermmissionService.CallDeletePermission(
        permission.permissionId
      );

      if (res && res.EC === 1 && !_.isEmpty(res.data)) {
        toast.success('Xóa quyền hạn thành công!');
        onSuccess(res.data.permissionId);
        onClose();
      } else {
        toast.error('Đã có lỗi xảy ra khi xóa quyền hạn!');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Đã có lỗi xảy ra khi xóa quyền hạn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Xác nhận xóa quyền hạn
          </DialogTitle>
          <DialogDescription>
            <span>
              Bạn có chắc muốn xóa quyền hạn <b>{permission?.name}</b> không?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Module: <b>{permission?.module}</b> | Method:{' '}
                <b>{permission?.method}</b>
              </span>
              <span className="text-sm text-gray-600">
                API Path: <b>{permission?.apiPath}</b>
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
