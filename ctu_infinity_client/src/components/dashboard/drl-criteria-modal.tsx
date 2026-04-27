"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { DRLPersonalizationModal } from "./drl-personalization-modal"

interface DRLCriteriaModalProps {
    isOpen: boolean
    onClose: () => void
}

// Mock data theo cấu trúc CTU
const drlCriteria = [
    {
        code: "I",
        name: "Đánh giá về ý thức tham gia học tập",
        maxPoints: 20,
        studentPoints: 18,
        children: [
            {
                code: "a",
                name: "Ý thức và thái độ trong học tập",
                maxPoints: 6,
                studentPoints: 6,
                children: [
                    {
                        name: "Đi học đầy đủ, đúng giờ, nghiêm túc trong giờ học (Mỗi môn bị cấm thi trừ 03 điểm)",
                        maxPoints: 6,
                        studentPoints: 6,
                    },
                ],
            },
            {
                code: "b",
                name: "Ý thức và thái độ tham gia các câu lạc bộ học thuật, các hoạt động học thuật, hoạt động ngoại khóa, hoạt động nghiên cứu khoa học",
                maxPoints: null,
                studentPoints: null,
                children: [
                    {
                        name: "Nghiên cứu khoa học (NCKH)",
                        maxPoints: null,
                        studentPoints: null,
                        subItems: [
                            {
                                name: "Có tham gia đề tài NCKH của sinh viên hoặc của Khoa và cấp trường được, có xác nhận của Chủ nhiệm đề tài",
                                maxPoints: 5,
                                studentPoints: 0,
                            },
                            {
                                name: "Có giấy khen về NCKH hoặc Chủ nhiệm đề tài NCKH",
                                maxPoints: 8,
                                studentPoints: 0,
                            },
                            {
                                name: "Có bài báo trong và ngoài nước trong hoạt động NCKH",
                                maxPoints: 8,
                                studentPoints: 0,
                            },
                        ],
                    },
                    {
                        name: "Hoàn thành chứng chỉ ngoại ngữ, tin học",
                        maxPoints: null,
                        studentPoints: null,
                        subItems: [
                            {
                                name: "Ngoại ngữ không chuyên/chứng chỉ A/chuẩn khung Châu Âu",
                                maxPoints: 3,
                                studentPoints: 0,
                            },
                            {
                                name: "Chứng chỉ B/chuẩn khung Châu Âu",
                                maxPoints: 5,
                                studentPoints: 0,
                            },
                            {
                                name: "Chứng chỉ C/chuẩn khung Châu Âu",
                                maxPoints: 7,
                                studentPoints: 7,
                            },
                            {
                                name: "Riêng chứng chỉ ngoại ngữ, Chứng nhận Toefl >= 500 điểm; IELTS >= 5.0; TOEIC >=600 điểm",
                                maxPoints: 10,
                                studentPoints: 0,
                            },
                        ],
                    },
                    {
                        name: "Tham gia các kỳ thi chuyên ngành, thi Olympic...",
                        maxPoints: null,
                        studentPoints: null,
                        subItems: [
                            {
                                name: "Có tham gia kỳ thi",
                                maxPoints: 2,
                                studentPoints: 0,
                            },
                            {
                                name: "Đạt giải cấp Trường",
                                maxPoints: 4,
                                studentPoints: 0,
                            },
                            {
                                name: "Đạt giải cấp cao hơn",
                                maxPoints: 7,
                                studentPoints: 0,
                            },
                        ],
                    },
                ],
            },
            {
                code: "c",
                name: "Ý thức và thái độ tham gia các kỳ thi, cuộc thi",
                maxPoints: 6,
                studentPoints: 6,
                children: [
                    {
                        name: "Không vi phạm quy chế về thi, kiểm tra (Mỗi lần vi phạm trừ 03 điểm)",
                        maxPoints: 6,
                        studentPoints: 6,
                    },
                ],
            },
            {
                code: "d",
                name: "Tinh thần vượt khó, phấn đấu vươn lên trong học tập",
                maxPoints: 2,
                studentPoints: 0,
                children: [
                    {
                        name: "Có cố gắng, vượt khó trong học tập (có ĐTB học kỳ sau lớn hơn học kỳ trước đó; đối với SV năm thứ nhất, học kỳ I không có điểm dưới 4)",
                        maxPoints: 2,
                        studentPoints: 0,
                    },
                ],
            },
            {
                code: "e",
                name: "Kết quả học tập",
                maxPoints: null,
                studentPoints: null,
                children: [
                    {
                        name: "Kết quả học tập trong học kỳ:",
                        maxPoints: null,
                        studentPoints: null,
                        subItems: [
                            {
                                name: "Điểm trung bình chung học kỳ (ĐTBCHK) đạt >= 3,60",
                                maxPoints: 8,
                                studentPoints: 0,
                            },
                            {
                                name: "ĐTBCHK đạt từ 3,20 đến 3,59",
                                maxPoints: 6,
                                studentPoints: 6,
                            },
                            {
                                name: "ĐTBCHK đạt từ 2,50 đến 3,19",
                                maxPoints: 4,
                                studentPoints: 0,
                            },
                            {
                                name: "ĐTBCHK đạt từ 2,00 đến 2,49",
                                maxPoints: 2,
                                studentPoints: 0,
                            },
                        ],
                    },
                ],
            },
        ],
    },
]

export function DRLCriteriaModal({ isOpen, onClose }: DRLCriteriaModalProps) {
    let sttCounter = 0
    const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false)

    const renderCriterion = (criterion: any, level: number = 0) => {
        const paddingLeft = level * 20

        // Main criterion row
        const mainRow = (
            <tr key={`criterion-${criterion.code || sttCounter}`} className="hover:bg-muted/50">
                <td className="p-3 text-center text-sm border border-gray-300">{criterion.code ? "" : ""}</td>
                <td className="p-3 text-sm border border-gray-300" style={{ paddingLeft: `${paddingLeft}px` }}>
                    <span className="font-semibold">
                        {criterion.code && `${criterion.code}. `}
                        {criterion.name}
                    </span>
                </td>
                <td className="p-3 text-center text-sm font-medium border border-gray-300">
                    {criterion.maxPoints !== null && criterion.maxPoints !== undefined ? criterion.maxPoints : "-"}
                </td>
                <td className="p-3 text-center text-sm border border-gray-300">
                    {criterion.studentPoints !== null && criterion.studentPoints !== undefined ? (
                        <Badge variant={criterion.studentPoints >= (criterion.maxPoints || 0) ? "default" : "secondary"}>
                            {criterion.studentPoints}
                        </Badge>
                    ) : (
                        "-"
                    )}
                </td>
            </tr>
        )

        const childRows: React.ReactElement[] = []

        // Render children
        if (criterion.children) {
            criterion.children.forEach((child: any) => {
                childRows.push(...renderCriterion(child, level + 1))
            })
        }

        // Render sub-items (dấu -)
        if (criterion.subItems) {
            criterion.subItems.forEach((subItem: any, index: number) => {
                sttCounter++
                childRows.push(
                    <tr key={`subitem-${sttCounter}`} className="hover:bg-muted/50">
                        <td className="p-3 text-center text-xs text-muted-foreground border border-gray-300">{sttCounter}</td>
                        <td className="p-3 text-sm border border-gray-300" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                            <span className="text-muted-foreground">- </span>
                            {subItem.name}
                        </td>
                        <td className="p-3 text-center text-sm font-medium border border-gray-300">{subItem.maxPoints}</td>
                        <td className="p-3 text-center text-sm border border-gray-300">
                            <Badge
                                variant={subItem.studentPoints >= subItem.maxPoints ? "default" : "secondary"}
                                className="text-xs"
                            >
                                {subItem.studentPoints}
                            </Badge>
                        </td>
                    </tr>
                )
            })
        }

        return [mainRow, ...childRows]
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Chi tiết tiêu chí đánh giá Điểm Rèn Luyện</DialogTitle>
                        <DialogDescription>
                            Bảng điểm chi tiết theo tiêu chí đánh giá của CTU - Học kỳ I, năm học 2024-2025
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {/* Summary */}
                        <div className="bg-primary/10 rounded-lg p-4 mb-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tổng điểm đạt được</p>
                                    <p className="text-3xl font-bold text-primary">77/100</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Xếp loại</p>
                                    <Badge className="text-lg px-4 py-1 mt-1">Khá</Badge>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={() => setIsPersonalizationOpen(true)}
                                        className="w-full gap-2"
                                        variant="default"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Cá nhân hóa
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead className="bg-primary text-primary-foreground">
                                    <tr>
                                        <th className="p-3 text-left text-sm font-semibold w-16 border border-gray-300">STT</th>
                                        <th className="p-3 text-left text-sm font-semibold border border-gray-300">Tên tiêu chí</th>
                                        <th className="p-3 text-center text-sm font-semibold w-32 border border-gray-300">Điểm tối đa</th>
                                        <th className="p-3 text-center text-sm font-semibold w-32 border border-gray-300">
                                            Dữ liệu Khoa/Trường
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>{drlCriteria.map((criterion) => renderCriterion(criterion))}</tbody>
                            </table>
                        </div>

                        {/* Note */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                                <strong>Lưu ý:</strong> Điểm rèn luyện được tính dựa trên các hoạt động đã tham gia và
                                được xác nhận. Vui lòng tham gia thêm các hoạt động để nâng cao điểm số.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DRLPersonalizationModal
                isOpen={isPersonalizationOpen}
                onClose={() => setIsPersonalizationOpen(false)}
            />
        </>
    )
}
