import type { ReactNode } from "react"

const COLORS: Record<string, string> = {
  zinc: "bg-zinc-100 text-zinc-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
}

export function Badge({ children, color = "zinc" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${COLORS[color] ?? COLORS.zinc}`}
    >
      {children}
    </span>
  )
}
