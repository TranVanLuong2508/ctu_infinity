"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface CriteriaData {
    id: string | number
    name: string
    maxPoints: number
    currentPoints: number
    color: string
}

interface DRLChartProps {
    data: CriteriaData[]
}

export function DRLChart({ data }: DRLChartProps) {
    const chartData = data.map((item, index) => ({
        name: `TC ${index + 1}`,
        fullName: item.name, // Giữ lại tên đầy đủ để hiện trong Tooltip
        "Điểm hiện tại": item.currentPoints,
        "Điểm tối đa": item.maxPoints,
        "Còn thiếu": item.maxPoints - item.currentPoints,
    }))

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs font-medium" />
                <YAxis className="text-xs" />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-card p-3 border rounded-lg shadow-sm max-w-[260px] sm:max-w-[350px]">
                                    <p className="font-semibold text-sm mb-2 whitespace-normal break-words">{data.fullName}</p>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-primary">Điểm hiện tại:</span>
                                            <span className="font-medium text-primary">{data["Điểm hiện tại"]}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Còn thiếu:</span>
                                            <span className="font-medium">{data["Còn thiếu"]}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 pt-1 border-t mt-1">
                                            <span className="text-muted-foreground font-medium">Điểm tối đa:</span>
                                            <span className="font-bold">{data["Điểm tối đa"]}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Legend className="pt-4" />
                <Bar name="Điểm hiện tại" dataKey="Điểm hiện tại" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Điểm tối đa" dataKey="Điểm tối đa" fill="#1e293b" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
