'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, QrCode as QrIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { eventMgmtApi } from '@/services/event-management.service';

interface QRCodeModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({
  eventId,
  eventName,
  isOpen,
  onClose,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState<number>(120);

  const timeOptions = [
    { value: 30, label: '30 phút' },
    { value: 60, label: '1 giờ' },
    { value: 120, label: '2 giờ' },
    { value: 240, label: '4 giờ' },
  ];

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      const response = await eventMgmtApi.generateQrToken(
        eventId,
        expiresInMinutes,
      );

      if (response && response.EC === 1) {
        const token = response.data?.token;

        if (!token) {
          toast.error('Không nhận được mã token!');
          return;
        }

        // Generate QR code from token
        const dataUrl = await QRCode.toDataURL(token, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        setQrDataUrl(dataUrl);
        toast.success('Tạo mã QR thành công!');
      } else {
        toast.error(response?.EM || 'Tạo mã QR thất bại!');
      }
    } catch (error: unknown) {
      console.error('Error generating QR:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message || 'Đã xảy ra lỗi khi tạo mã QR!',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${eventName.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Đã tải xuống mã QR!');
  };

  const handleClose = () => {
    setQrDataUrl('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mã QR Check-in</DialogTitle>
          <DialogDescription>
            Tạo mã QR để sinh viên quét và check-in sự kiện
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sự kiện</label>
            <p className="text-sm text-muted-foreground">{eventName}</p>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Thời hạn mã QR</label>
            <Select
              value={expiresInMinutes.toString()}
              onValueChange={(value) => setExpiresInMinutes(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Mã QR sẽ hết hạn sau thời gian đã chọn
            </p>
          </div>

          {/* Generate Button */}
          {!qrDataUrl && (
            <Button
              onClick={handleGenerateQR}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <QrIcon className="mr-2 h-4 w-4" />
                  Tạo mã QR
                </>
              )}
            </Button>
          )}

          {/* QR Code Display */}
          {qrDataUrl && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-full max-w-[300px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Tải xuống
                </Button>
                <Button
                  onClick={() => setQrDataUrl('')}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tạo mới
                </Button>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Mã QR này sẽ hết hạn sau{' '}
                  <span className="font-medium">
                    {
                      timeOptions.find((opt) => opt.value === expiresInMinutes)
                        ?.label
                    }
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
