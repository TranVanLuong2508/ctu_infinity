"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-primary/10 to-background" />
            <div className="container mx-auto px-4 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Tích hợp AI
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold text-balance">
                            Quản lý{" "}
                            <span className="text-primary">Điểm Rèn Luyện</span>
                            <br className="hidden md:block" />
                            <span className="hidden md:inline">Thông Minh</span>
                            <span className="md:hidden">Thông Minh</span>
                        </h1>
                        <p className="text-xl text-muted-foreground text-balance">
                            Hệ thống quản lý DRL tích hợp máy học giúp bạn tối ưu điểm số và tìm kiếm hoạt động phù hợp
                            một cách dễ dàng
                        </p>
                    </div>
                    <div className="relative">
                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle>Tổng quan điểm DRL</CardTitle>
                                <CardDescription>Ví dụ dashboard cá nhân hóa</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tổng điểm</span>
                                    <span className="text-3xl font-bold text-primary">77/100</span>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { name: "Học tập", value: 85 },
                                        { name: "Tình nguyện", value: 60 },
                                        { name: "Kỹ năng", value: 70 },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>{item.name}</span>
                                                <span className="text-muted-foreground">{item.value}%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${item.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full" variant="outline">
                                    Xem chi tiết
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}
