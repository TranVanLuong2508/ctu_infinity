"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/auth.service"
import { toast } from "sonner"
import { AUTH_MESSAGES } from "@/constants/messages/authMessage"
import { LogOut, User as UserIcon, Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppRouter } from "@/hooks/useAppRouter"

export function UserDropdown() {
    const router = useRouter()
    const { authUser, logOutAction } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { goLogin } = useAppRouter()

    const handleLogout = async () => {
        try {
            await authService.callLogout()
            toast.success(AUTH_MESSAGES.logoutSucess)
        } catch (error) {
            console.log("Logout error:", error)
            toast.error(AUTH_MESSAGES.errorLogout)
        } finally {
            logOutAction()
            goLogin()
        }
    }

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="gap-2 focus:ring-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium leading-none mb-1">{authUser.fullName || "Sinh viên"}</p>
                        <p className="text-xs text-muted-foreground leading-none">{authUser.email}</p>
                    </div>
                    <div className="py-1">
                        <button
                            onClick={() => { setIsOpen(false); router.push("/my-events") }}
                            className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Sự kiện của tôi</span>
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); router.push("/profile") }}
                            className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Thông tin sinh viên</span>
                        </button>
                    </div>
                    <div className="border-t border-border py-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
