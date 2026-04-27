"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, QrCode, CheckCircle2 } from "lucide-react"

// Mock pending attendance data
const pendingAttendance = [
    {
        id: 1,
        eventTitle: "Hiến máu nhân đạo",
        studentName: "Nguyễn Văn A",
        mssv: "B2014567",
        submittedAt: "2025-01-15 14:30",
        method: "QR Code",
    },
    {
        id: 2,
        eventTitle: "Workshop kỹ năng mềm",
        studentName: "Trần Thị B",
        mssv: "B2014568",
        submittedAt: "2025-01-15 14:32",
        method: "Form",
    },
    {
        id: 3,
        eventTitle: "Ngày hội tình nguyện",
        studentName: "Lê Văn C",
        mssv: "B2014569",
        submittedAt: "2025-01-15 14:35",
        method: "QR Code",
    },
]

export default function AttendancePage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [attendanceList, setAttendanceList] = useState(pendingAttendance)

    const handleApprove = (id: number) => {
        setAttendanceList(attendanceList.filter((item) => item.id !== id))
    }

    const handleReject = (id: number) => {
        setAttendanceList(attendanceList.filter((item) => item.id !== id))
    }

    const filteredList = attendanceList.filter(
        (item) =>
            item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.mssv.includes(searchQuery) ||
            item.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Quản lý điểm danh</h1>
                            <p className="text-sm text-muted-foreground">Duyệt và xác nhận điểm danh</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Chờ duyệt</p>
                            <p className="text-3xl font-bold text-yellow-500">{attendanceList.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Đã duyệt hôm nay</p>
                            <p className="text-3xl font-bold text-green-500">24</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Từ chối hôm nay</p>
                            <p className="text-3xl font-bold text-red-500">2</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo tên, MSSV hoặc sự kiện..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pending List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách chờ duyệt</CardTitle>
                        <CardDescription>{attendanceList.length} yêu cầu đang chờ xác nhận</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredList.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-xl border border-border/40 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{item.studentName}</h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {item.mssv}
                                                </Badge>
                                                {item.method === "QR Code" ? (
                                                    <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
                                                        <QrCode className="w-3 h-3 mr-1" />
                                                        QR
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Form
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">Sự kiện: {item.eventTitle}</p>
                                            <p className="text-xs text-muted-foreground">Gửi lúc: {item.submittedAt}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-500 bg-transparent"
                                                onClick={() => handleReject(item.id)}
                                            >
                                                Từ chối
                                            </Button>
                                            <Button size="sm" onClick={() => handleApprove(item.id)}>
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Duyệt
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredList.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                {searchQuery ? "Không tìm thấy kết quả" : "Không có yêu cầu nào đang chờ duyệt"}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
