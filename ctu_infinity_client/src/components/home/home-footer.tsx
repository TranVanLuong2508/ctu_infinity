import Image from "next/image"

export function HomeFooter() {
    return (
        <footer className="border-t py-8 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="CTU Infinity" width={32} height={32} className="object-contain" />
                        <div>
                            <p className="font-semibold">CTU Infinity</p>
                            <p className="text-xs text-muted-foreground">Đại học Cần Thơ</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">© 2025 CTU Infinity. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
