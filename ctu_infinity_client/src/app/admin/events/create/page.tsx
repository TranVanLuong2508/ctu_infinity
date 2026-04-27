'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    criteriaId: '',
    points: '',
    maxParticipants: '',
    organizer: '',
    requirements: '',
    benefits: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedPoints = Number(formData.points);
    if (!Number.isInteger(parsedPoints) || parsedPoints < 1) {
      return;
    }

    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      router.push('/admin');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Tạo sự kiện mới</h1>
              <p className="text-sm text-muted-foreground">
                Điền thông tin sự kiện
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sự kiện</CardTitle>
            <CardDescription>
              Các thông tin bắt buộc để tạo sự kiện mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Tên sự kiện <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="VD: Hiến máu nhân đạo"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Mô tả ngắn <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả ngắn gọn về sự kiện"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Ngày diễn ra <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    Thời gian <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    placeholder="VD: 08:00 - 12:00"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Địa điểm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="VD: Hội trường A"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="criteriaId">
                    Tiêu chí <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.criteriaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, criteriaId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tiêu chí" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Học tập</SelectItem>
                      <SelectItem value="2">Nội quy</SelectItem>
                      <SelectItem value="3">Tình nguyện</SelectItem>
                      <SelectItem value="4">Kỹ năng</SelectItem>
                      <SelectItem value="5">Đoàn, Hội</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">
                    Điểm rèn luyện <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    placeholder="VD: 5"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({ ...formData, points: e.target.value })
                    }
                    required
                    min="1"
                    step="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">
                    Số lượng tối đa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="VD: 100"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: e.target.value,
                      })
                    }
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizer">
                  Đơn vị tổ chức <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="organizer"
                  placeholder="VD: Đoàn Thanh niên"
                  value={formData.organizer}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Yêu cầu tham gia</Label>
                <Textarea
                  id="requirements"
                  placeholder="Mỗi yêu cầu một dòng"
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Quyền lợi</Label>
                <Textarea
                  id="benefits"
                  placeholder="Mỗi quyền lợi một dòng"
                  value={formData.benefits}
                  onChange={(e) =>
                    setFormData({ ...formData, benefits: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => router.push('/admin')}
                >
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Đang lưu...' : 'Tạo sự kiện'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
