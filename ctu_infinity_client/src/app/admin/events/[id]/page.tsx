"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle2, XCircle, Search, QrCode, Download } from "lucide-react"

// Mock participants data
const participantsData = [
    {
        id: 1,
        mssv: "B2014567",
        name: "Nguyễn Văn A",
        email: "b2014567@student.ctu.edu.vn",
        status: "registered",
        attended: false,
    },
    {
        id: 2,
        mssv: "B2014568",
        name: "Trần Thị B",
        email: "b2014568@student.ctu.edu.vn",
        status: "registered",
        attended: false,
    },
    {
        id: 3,
        mssv: "B2014569",
        name: "Lê Văn C",
        email: "b2014569@student.ctu.edu.vn",
        status: "registered",
        attended: false,
    },
    {
        id: 4,
        mssv: "B2014570",
        name: "Phạm Thị D",
        email: "b2014570@student.ctu.edu.vn",
        status: "registered",
        attended: false,
    },
    {
        id: 5,
        mssv: "B2014571",
        name: "Hoàng Văn E",
        email: "b2014571@student.ctu.edu.vn",
        status: "registered",
        attended: false,
    },
]

export default function AdminEventDetailPage({ params }: { params: { id: string } }) {
    const { id } = params
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [participants, setParticipants] = useState(participantsData)

    const toggleAttendance = (participantId: number) => {
        setParticipants(participants.map((p) => (p.id === participantId ? { ...p, attended: !p.attended } : p)))
    }

    const filteredParticipants = participants.filter(
        (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mssv.includes(searchQuery),
    )

    const attendedCount = participants.filter((p) => p.attended).length
    const totalCount = participants.length
    const attendanceRate = totalCount > 0 ? (attendedCount / totalCount) * 100 : 0

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
                            <h1 className="text-xl font-bold">Quản lý sự kiện</h1>
                            <p className="text-sm text-muted-foreground">Hiến máu nhân đạo</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Tổng đăng ký</p>
                                <p className="text-3xl font-bold">{totalCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Đã tham dự</p>
                                <p className="text-3xl font-bold text-green-500">{attendedCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Vắng mặt</p>
                                <p className="text-3xl font-bold text-red-500">{totalCount - attendedCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Tỷ lệ tham dự</p>
                                <p className="text-3xl font-bold text-primary">{attendanceRate.toFixed(0)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Công cụ điểm danh</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button variant="outline">
                                <QrCode className="w-4 h-4 mr-2" />
                                Tạo QR điểm danh
                            </Button>
                            <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Xuất danh sách Excel
                            </Button>
                            <Button variant="outline">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Điểm danh hàng loạt
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Participants List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <CardTitle>Danh sách người tham gia</CardTitle>
                            <div className="relative w-full max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm theo tên hoặc MSSV..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredParticipants.map((participant) => (
                                <div
                                    key={participant.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${participant.attended ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {participant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{participant.name}</p>
                                                {participant.attended && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{participant.mssv}</p>
                                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {participant.attended ? (
                                            <>
                                                <Badge className="bg-green-500 hover:bg-green-600">Đã điểm danh</Badge>
                                                <Button size="sm" variant="outline" onClick={() => toggleAttendance(participant.id)}>
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Badge variant="secondary">Chưa điểm danh</Badge>
                                                <Button size="sm" onClick={() => toggleAttendance(participant.id)}>
                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                    Điểm danh
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredParticipants.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">Không tìm thấy người tham gia</div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
