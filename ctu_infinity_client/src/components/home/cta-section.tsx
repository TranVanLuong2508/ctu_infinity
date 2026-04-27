'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const router = useRouter();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng tối ưu điểm DRL của bạn?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bắt đầu ngay hôm nay để khám phá tiềm năng và đạt được mục tiêu
              điểm rèn luyện
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {/* <Button
                size="lg"
                className="gap-2"
                onClick={() => router.push('/register')}
              >
                Đăng ký miễn phí
                <ArrowRight className="w-4 h-4" />
              </Button> */}
              <Button
                size="lg"
                // variant="outline"
                onClick={() => router.push('/login')}
              >
                Đăng nhập
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
