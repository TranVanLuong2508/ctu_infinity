"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart3,
    Calendar,
    Target,
    Users,
    Bell,
    QrCode,
    Sparkles,
    LucideIcon,
} from "lucide-react"

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    color: string
}

const features: Feature[] = [
    {
        icon: BarChart3,
        title: "Theo dõi điểm DRL",
        description: "Xem chi tiết điểm rèn luyện theo từng tiêu chí đánh giá của CTU",
        color: "bg-blue-500",
    },
    {
        icon: Target,
        title: "Phân tích thiếu sót",
        description: "Xác định chính xác các mục còn thiếu để tối ưu điểm số",
        color: "bg-purple-500",
    },
    {
        icon: Sparkles,
        title: "Gợi ý thông minh",
        description: "AI đề xuất hoạt động phù hợp dựa trên nhu cầu cá nhân",
        color: "bg-pink-500",
    },
    {
        icon: Calendar,
        title: "Quản lý sự kiện",
        description: "Dễ dàng tìm kiếm và đăng ký các sự kiện phù hợp",
        color: "bg-green-500",
    },
    {
        icon: Bell,
        title: "Thông báo thông minh",
        description: "Nhận thông báo về sự kiện quan tâm và trước giờ check-in",
        color: "bg-yellow-500",
    },
    {
        icon: QrCode,
        title: "Điểm danh QR Code",
        description: "Check-in nhanh chóng bằng QR code tại sự kiện",
        color: "bg-indigo-500",
    },
]

export function FeaturesSection() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Tính năng nổi bật</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Hệ thống toàn diện giúp bạn quản lý DRL hiệu quả
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <Card
                                key={index}
                                className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
                            >
                                <CardHeader>
                                    <div
                                        className={`w-12 h-12 rounded-lg ${feature.color}/10 flex items-center justify-center mb-4`}
                                    >
                                        <Icon className={`w-6 h-6 ${feature.color.replace("bg-", "text-")}`} />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
