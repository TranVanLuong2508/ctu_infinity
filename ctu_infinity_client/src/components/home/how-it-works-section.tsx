'use client';

import { ArrowRight } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Xem phân tích DRL',
    description: 'Kiểm tra điểm hiện tại và xác định các mục còn thiếu',
  },
  {
    number: '02',
    title: 'Xem các sự kiện phù hợp',
    description: 'Tìm các sự kiện phù hơp với nhu cầu của bản thân',
  },
  {
    number: '03',
    title: 'Đăng ký sự kiện',
    description: 'Chọn và đăng ký tham gia các sự kiện phù hợp',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cách thức hoạt động
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            3 bước đơn giản để tối ưu điểm DRL của bạn
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-12 -right-8 w-6 h-6 text-primary/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
