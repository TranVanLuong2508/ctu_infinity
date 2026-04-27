"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, GraduationCap, MapPin, Calendar, Hash, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { studentService, IStudentProfile } from "@/services/student.service"
import { toast } from "sonner"
import { UserDropdown } from "@/components/shared/user-dropdown"
import { Header } from "@/components/shared/header"

export default function ProfilePage() {
    const router = useRouter()
    const { isAuthenticated, isLoading, authUser } = useAuthStore()
    const [profile, setProfile] = useState<IStudentProfile | null>(null)
    const [isFetching, setIsFetching] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchProfile = async () => {
            if (!isAuthenticated) return
            try {
                setIsFetching(true)
                const res = await studentService.getMyProfile()
                if (res.EC === 1 && res.data) {
                    // Extract payload wrapped by backend global interceptor
                    setProfile(res.data)
                }
            } catch (error) {
                console.error("Failed to fetch profile", error)
                toast.error("Không thể lấy thông tin sinh viên")
            } finally {
                setIsFetching(false)
            }
        }
        fetchProfile()
    }, [isAuthenticated])

    if (!isAuthenticated) return null

    // Cần phải parse lại payload do response interceptor trả về { EC, EM, data... hay là chứa data thẳng }
    // Tuy nhiên theo student.service.ts backend: { EC: 1, EM: '...', ...mapped }
    // Tức là payload trả về object phẳng với các thuộc tính của student
    const studentData = profile as any;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            <main className="container mx-auto max-w-4xl px-4 py-8">
                <div className="flex flex-col items-center md:flex-row md:justify-center relative mb-8 gap-4 px-0">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="absolute left-0 top-0 md:top-1/2 md:-translate-y-1/2 w-fit -ml-2 md:ml-0">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div className="text-center mt-8 md:mt-0 px-8 sm:px-0">
                        <h1 className="text-2xl md:text-3xl font-bold">Thông tin sinh viên</h1>
                        <p className="text-sm text-muted-foreground mt-1">Hồ sơ cá nhân và học thuật</p>
                    </div>
                </div>
                {isFetching ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Sidebar */}
                        <Card className="md:col-span-1">
                            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold mb-1">
                                    {studentData?.user?.fullName || authUser.fullName || "Sinh viên"}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {studentData?.studentCode || "Chưa cập nhật MSSV"}
                                </p>
                                <div className="w-full px-4 py-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Năm nhập học</span>
                                    <span className="font-semibold">{studentData?.enrollmentYear || "N/A"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile Details */}
                        <Card className="md:col-span-2">
                            <CardHeader className="text-center sm:text-left">
                                <CardTitle className="text-2xl sm:text-xl">Thông tin chi tiết</CardTitle>
                                <CardDescription className="text-base sm:text-sm">Thông tin liên hệ và học thuật của sinh viên</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Thông tin cá nhân */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Thông tin liên hệ</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <User className="w-4 h-4 mr-2" /> Họ và tên
                                            </div>
                                            <p className="font-medium">{studentData?.user?.fullName || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Mail className="w-4 h-4 mr-2" /> Email
                                            </div>
                                            <p className="font-medium">{studentData?.user?.email || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Shield className="w-4 h-4 mr-2" /> Chức vụ
                                            </div>
                                            <p className="font-medium">Sinh viên</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <User className="w-4 h-4 mr-2" /> Giới tính
                                            </div>
                                            <p className="font-medium">{studentData?.user?.gender === "male" ? "Nam" : studentData?.user?.gender === "female" ? "Nữ" : "Khác"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin học thuật */}
                                <div className="pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Thông tin học thuật</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <GraduationCap className="w-4 h-4 mr-2" /> Khoa/Trường
                                            </div>
                                            <p className="font-medium">{studentData?.class?.major?.falculty?.falcultyName || "Chưa có thông tin"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4 mr-2" /> Chuyên ngành
                                            </div>
                                            <p className="font-medium">{studentData?.class?.major?.majorName || "Chưa có thông tin"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4 mr-2" /> Mã lớp
                                            </div>
                                            <p className="font-medium">{studentData?.class?.className || "Chưa có thông tin"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    )
}
