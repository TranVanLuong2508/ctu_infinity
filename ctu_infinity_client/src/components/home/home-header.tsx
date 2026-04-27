"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function HomeHeader() {
    const router = useRouter()

    return (
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 h-16">
                        <Image src="/logo.png" alt="CTU Infinity" width={64} height={64} className="object-contain h-full w-auto py-1" />
                        <div>
                            <h1 className="text-xl font-bold">CTU Infinity</h1>
                            <p className="text-xs text-muted-foreground">Quản lý Điểm Rèn Luyện</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => router.push("/login")}>
                            Đăng nhập
                        </Button>
                        <Button onClick={() => router.push("/register")}>Đăng ký</Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
