'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, CheckCircle2, XCircle, Award } from 'lucide-react';
import { attendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import { Header } from '@/components/shared/header';

export default function ScanQRPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    eventName?: string;
    score?: number;
  } | null>(null);

  const handleCheckIn = async (qrToken: string) => {
    try {
      const response = await attendanceService.checkInByQR(qrToken);

      if (response && response.EC === 1) {
        setResult({
          success: true,
          message: response.EM || 'Check-in thành công!',
          eventName: response.data?.eventName,
          score: response.data?.score,
        });
        toast.success(response.EM || 'Check-in thành công!');
      } else {
        setResult({
          success: false,
          message: response?.EM || 'Check-in thất bại!',
        });
        toast.error(response?.EM || 'Check-in thất bại!');
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; EM?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.EM ||
        err?.message ||
        'Đã xảy ra lỗi khi check-in!';

      setResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    // Reload page để khởi tạo lại scanner
    window.location.reload();
  };

  const handleScanError = (error: unknown) => {
    let msg = '';
    if (typeof error === 'string') {
      msg = error;
    } else if (typeof error === 'object' && error !== null) {
      const err = error as {
        type?: number;
        message?: string;
        error?: { message?: string };
      };
      // Html5QrcodeErrorType.NO_QR_CODE_FOUND = 2: xảy ra liên tục khi camera
      // quét từng frame mà không thấy QR → bỏ qua, KHÔNG toast.
      if (err.type === 2) {
        return;
      }
      if (err.type === 5) {
        // Html5QrcodeErrorType.INPUT_FILE_ERROR = 5: user chọn file ảnh nhưng ảnh
        // không chứa QR → đây là lỗi thực sự, toast một lần.
        toast.error(
          'Không tìm thấy mã QR trong ảnh. Vui lòng chọn ảnh chứa mã QR rõ ràng.',
        );
        return;
      }
      msg = err.message || err.error?.message || String(error);
    }
    console.debug('QR scan error:', msg);
  };

  useEffect(() => {
    // Khởi tạo scanner khi component mount
    let scanner: Html5QrcodeScanner | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Inject CSS để canh giữa icon (backup nếu globals.css chưa load kịp)
    const injectStyles = () => {
      if (document.getElementById('qr-reader-custom-css')) return;
      const style = document.createElement('style');
      style.id = 'qr-reader-custom-css';
      style.textContent = `
        #qr-reader { text-align: center !important; }
        #qr-reader__dashboard button,
        #qr-reader__dashboard a { margin: 0 auto !important; }
      `;
      document.head.appendChild(style);
    };

    // Ghi đè nhãn button của thư viện html5-qrcode sang tiếng Việt bằng DOM manipulation
    const applyVietnameseLabels = () => {
      const buttonTexts: Record<string, string> = {
        'Request Camera Permissions': 'Yêu cầu quyền camera',
        'Scan an Image File': 'Quét từ tệp ảnh',
        'Scan using camera directly': 'Quét bằng camera',
        'Requesting camera permissions...': 'Đang yêu cầu quyền camera...',
        'No camera found': 'Không tìm thấy camera',
        'Stop Scanning': 'Dừng quét',
        'Start Scanning': 'Bắt đầu quét',
        'Choose Image': 'Chọn ảnh',
        'Choose Another': 'Chọn ảnh khác',
        'Loading image...': 'Đang tải ảnh...',
        'Or drop an image to scan': 'Kéo thả ảnh vào đây để quét',
      };
      const elements = document.querySelectorAll(
        '#qr-reader button, #qr-reader span',
      );
      elements.forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (buttonTexts[text]) {
          el.textContent = buttonTexts[text];
        }
      });
      // Tiếp tục áp dụng nếu DOM chưa đầy đủ
      timeoutId = setTimeout(applyVietnameseLabels, 300);
    };

    const initScanner = () => {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false,
      );

      scanner.render(async (decodedText) => {
        // Dừng scanner
        scanner?.clear();
        setScanning(false);

        // Gọi API check-in
        await handleCheckIn(decodedText);
      }, handleScanError);

      setScanning(true);
      // Áp dụng CSS custom và nhãn tiếng Việt
      injectStyles();
      setTimeout(() => {
        injectStyles();
        applyVietnameseLabels();
      }, 200);
    };

    initScanner();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      scanner?.clear().catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex flex-col items-center md:flex-row md:justify-center relative mb-8 gap-4 px-0">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="absolute left-0 top-0 md:top-1/2 md:-translate-y-1/2 w-fit -ml-2 md:ml-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div className="text-center mt-8 md:mt-0 px-8 sm:px-0">
            <h1 className="text-2xl md:text-3xl font-bold">Quét mã QR</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Check-in sự kiện bằng mã QR
            </p>
          </div>
        </div>
        {!result ? (
          // Scanner view
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Quét mã QR của sự kiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* QR Scanner */}
                <div
                  id="qr-reader"
                  className="w-full rounded-lg overflow-hidden [&_img]:mx-auto [&_img]:block [&_i]:mx-auto [&_i]:block"
                />

                {scanning && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Đưa mã QR vào khung hình để quét
                    </p>
                  </div>
                )}

                {/* Instructions */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 text-sm">Hướng dẫn:</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Cho phép truy cập camera khi được yêu cầu</li>
                      <li>• Giữ mã QR trong khung hình để quét</li>
                      <li>• Đảm bảo ánh sáng đủ và mã QR rõ nét</li>
                      <li>• Hệ thống sẽ tự động check-in sau khi quét</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Result view
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="text-green-600">Thành công!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="text-red-600">Thất bại!</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{result.message}</p>

                {result.success && result.eventName && (
                  <div className="rounded-lg bg-white border border-border p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Sự kiện</p>
                      <p className="font-semibold">{result.eventName}</p>
                    </div>

                    {result.score && (
                      <div className="flex items-center gap-2 text-primary">
                        <Award className="w-4 h-4" />
                        <p className="font-semibold">+{result.score} điểm</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/dashboard')}
                >
                  Về Dashboard
                </Button>
                <Button className="flex-1" onClick={handleScanAgain}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Quét lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
