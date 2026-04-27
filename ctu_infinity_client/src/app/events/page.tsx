"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, MapPin, Search, Users, Clock, Eye } from "lucide-react"
import { RegisterEventModal } from "@/components/ui/register-event-modal"
import { Header } from "@/components/shared/header"

// Mock events data with more details
const eventsData = [
    {
        id: 1,
        title: "Hiến máu nhân đạo",
        date: "2025-01-20",
        time: "08:00 - 12:00",
        location: "Hội trường A",
        criteriaId: 3,
        criteriaName: "Hoạt động tình nguyện, xã hội",
        points: 5,
        participants: 45,
        maxParticipants: 100,
        status: "upcoming",
        description: "Chương trình hiến máu nhân đạo phục vụ cộng đồng",
        organizer: "Hội Sinh viên",
    },
    {
        id: 2,
        title: "Workshop kỹ năng mềm",
        date: "2025-01-22",
        time: "14:00 - 17:00",
        location: "Phòng E101",
        criteriaId: 4,
        criteriaName: "Hội nhập và phát triển kỹ năng",
        points: 3,
        participants: 28,
        maxParticipants: 50,
        status: "upcoming",
        description: "Đào tạo kỹ năng giao tiếp và làm việc nhóm",
        organizer: "CLB Kỹ năng mềm",
    },
    {
        id: 3,
        title: "Ngày hội tình nguyện",
        date: "2025-01-25",
        time: "07:00 - 16:00",
        location: "Sân trường",
        criteriaId: 3,
        criteriaName: "Hoạt động tình nguyện, xã hội",
        points: 6,
        participants: 120,
        maxParticipants: 200,
        status: "upcoming",
        description: "Ngày hội tình nguyện vì cộng đồng",
        organizer: "Đoàn Thanh niên",
    },
    {
        id: 4,
        title: "Hội thảo khởi nghiệp",
        date: "2025-01-28",
        time: "13:00 - 16:00",
        location: "Phòng D201",
        criteriaId: 4,
        criteriaName: "Hội nhập và phát triển kỹ năng",
        points: 4,
        participants: 15,
        maxParticipants: 60,
        status: "upcoming",
        description: "Chia sẻ kinh nghiệm khởi nghiệp từ các chuyên gia",
        organizer: "CLB Khởi nghiệp",
    },
    {
        id: 5,
        title: "Đại hội Đoàn trường",
        date: "2025-02-01",
        time: "08:00 - 12:00",
        location: "Hội trường lớn",
        criteriaId: 5,
        criteriaName: "Hoạt động đoàn, hội",
        points: 8,
        participants: 200,
        maxParticipants: 300,
        status: "upcoming",
        description: "Đại hội Đoàn TNCS Hồ Chí Minh nhiệm kỳ 2025-2026",
        organizer: "Đoàn Thanh niên",
    },
]

export default function EventsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTab, setSelectedTab] = useState("all")
    const [selectedEvent, setSelectedEvent] = useState<typeof eventsData[0] | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const filteredEvents = eventsData.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTab = selectedTab === "all" || event.criteriaId.toString() === selectedTab
        return matchesSearch && matchesTab
    })

    const handleRegisterClick = (event: typeof eventsData[0]) => {
        setSelectedEvent(event)
        setIsModalOpen(true)
    }

    const handleRegisterConfirm = () => {
        // In real app, this would call API
        console.log("Registered for event:", selectedEvent?.title)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center md:flex-row md:justify-center relative mb-8 gap-4 px-0">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="absolute left-0 top-0 md:top-1/2 md:-translate-y-1/2 w-fit -ml-2 md:ml-0">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div className="text-center mt-8 md:mt-0 px-8 sm:px-0">
                        <h1 className="text-2xl md:text-3xl font-bold">Sự kiện & Hoạt động</h1>
                        <p className="text-sm text-muted-foreground mt-1">Danh sách tất cả sự kiện sắp diễn ra</p>
                    </div>
                </div>
                {/* Search and Filter */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex gap-4 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm sự kiện..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for filtering by criteria */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="3">Tình nguyện</TabsTrigger>
                        <TabsTrigger value="4">Kỹ năng</TabsTrigger>
                        <TabsTrigger value="5">Đoàn, Hội</TabsTrigger>
                        <TabsTrigger value="1">Học tập</TabsTrigger>
                        <TabsTrigger value="2">Nội quy</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Events List */}
                <div className="grid gap-6 md:grid-cols-2">
                    {filteredEvents.map((event) => {
                        const dateObj = new Date(event.date)
                        const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        })

                        const participantPercent = (event.participants / event.maxParticipants) * 100

                        return (
                            <Card key={event.id} className="hover:shadow-md hover:-translate-y-px transition-all duration-200">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                            {event.criteriaName}
                                        </Badge>
                                        <Badge className="bg-green-500 hover:bg-green-600">+{event.points} điểm</Badge>
                                    </div>
                                    <CardTitle className="text-xl text-balance">{event.title}</CardTitle>
                                    <CardDescription>{event.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formattedDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            <span>
                                                {event.participants}/{event.maxParticipants} người đăng ký ({participantPercent.toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-xs text-muted-foreground mb-3">Tổ chức: {event.organizer}</p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => router.push(`/events/${event.id}`)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Xem chi tiết
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={() => handleRegisterClick(event)}
                                            >
                                                Đăng ký
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {filteredEvents.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-muted-foreground">Không tìm thấy sự kiện nào phù hợp</p>
                        </CardContent>
                    </Card>
                )}

                {/* Registration Modal */}
                <RegisterEventModal
                    event={selectedEvent}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleRegisterConfirm}
                />
            </main>
        </div>
    )
}
