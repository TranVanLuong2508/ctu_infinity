"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, TrendingUp, Plus, BarChart3, LogOut } from "lucide-react"

// Mock admin stats
const adminStats = {
    totalEvents: 15,
    activeEvents: 8,
    totalParticipants: 523,
    pendingApprovals: 12,
}

// Mock recent events
const recentEvents = [
    {
        id: 1,
        title: "Hiến máu nhân đạo",
        date: "2025-01-20",
        participants: 45,
        maxParticipants: 100,
        status: "upcoming",
    },
    {
        id: 2,
        title: "Workshop kỹ năng mềm",
        date: "2025-01-22",
        participants: 28,
        maxParticipants: 50,
        status: "upcoming",
    },
    {
        id: 3,
        title: "Ngày hội tình nguyện",
        date: "2025-01-25",
        participants: 120,
        maxParticipants: 200,
        status: "upcoming",
    },
    {
        id: 10,
        title: "Ngày hội tuyển sinh",
        date: "2024-12-15",
        participants: 156,
        maxParticipants: 200,
        status: "completed",
    },
]

export default function AdminPage() {
    const router = useRouter()
    const [user, setUser] = useState<{ mssv: string; name: string } | null>(null)

    useEffect(() => {
        const userData = localStorage.getItem("user")
        if (!userData) {
            router.push("/login")
        } else {
            setUser(JSON.parse(userData))
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem("user")
        router.push("/login")
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image src="/logo.png" alt="CTU Infinity" width={40} height={40} className="object-contain" />
                            <div>
                                <h1 className="text-xl font-bold">Quản trị viên</h1>
                                <p className="text-sm text-muted-foreground">Đoàn - Hội Sinh viên</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => router.push("/admin/events/create")}>
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo sự kiện
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Tổng sự kiện</p>
                                    <p className="text-3xl font-bold">{adminStats.totalEvents}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{adminStats.activeEvents} đang hoạt động</p>
                                </div>
                                <div className="p-3 rounded-xl bg-primary/10">
                                    <Calendar className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Tổng người tham gia</p>
                                    <p className="text-3xl font-bold">{adminStats.totalParticipants}</p>
                                    <p className="text-xs text-green-500 mt-1">+45 tuần này</p>
                                </div>
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <Users className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Chờ duyệt</p>
                                    <p className="text-3xl font-bold">{adminStats.pendingApprovals}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Điểm danh chờ xác nhận</p>
                                </div>
                                <div className="p-3 rounded-xl bg-yellow-500/10">
                                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Tỷ lệ tham dự</p>
                                    <p className="text-3xl font-bold text-primary">87%</p>
                                    <p className="text-xs text-muted-foreground mt-1">Trung bình tháng này</p>
                                </div>
                                <div className="p-3 rounded-xl bg-primary/10">
                                    <BarChart3 className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Thao tác nhanh</CardTitle>
                        <CardDescription>Các chức năng quản trị thường dùng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex-col gap-2 bg-transparent"
                                onClick={() => router.push("/admin/events/create")}
                            >
                                <Plus className="w-6 h-6" />
                                <span>Tạo sự kiện mới</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex-col gap-2 bg-transparent"
                                onClick={() => router.push("/admin/events")}
                            >
                                <Calendar className="w-6 h-6" />
                                <span>Quản lý sự kiện</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 flex-col gap-2 bg-transparent"
                                onClick={() => router.push("/admin/attendance")}
                            >
                                <Users className="w-6 h-6" />
                                <span>Điểm danh</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Events */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sự kiện gần đây</CardTitle>
                        <CardDescription>Danh sách các sự kiện đã tạo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentEvents.map((event) => {
                                const dateObj = new Date(event.date)
                                const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })
                                const participantPercent = (event.participants / event.maxParticipants) * 100

                                return (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">{event.title}</h3>
                                                {event.status === "upcoming" ? (
                                                    <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">Sắp diễn ra</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Đã kết thúc
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formattedDate}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>
                                                        {event.participants}/{event.maxParticipants} ({participantPercent.toFixed(0)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/events/${event.id}`)}>
                                            Chi tiết
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
