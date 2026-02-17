import type { ExpenseDTO } from "@/types/expenses"
import { EXPENSE_STATUS_COLORS } from "@/constants/expenses"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MoreVertical } from "lucide-react"

interface ExpenseRowProps {
  expense: ExpenseDTO
  /** Callback fired when user clicks edit on this expense */
  onEdit?: (expense: ExpenseDTO) => void
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export function ExpenseRow({ expense, onEdit }: ExpenseRowProps) {
  const formattedAmount = currencyFormatter.format(expense.amount ?? 0)
  let formattedDate = "N/A"
  if (expense.dueDate) {
    try {
      const date = new Date(expense.dueDate)
      if (!isNaN(date.getTime())) {
        formattedDate = dateFormatter.format(date)
      }
    } catch {
      formattedDate = "N/A"
    }
  }
  const statusColorClass = EXPENSE_STATUS_COLORS[expense.status] || ""

  const handleEdit = () => {
    onEdit?.(expense)
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onSelect={handleEdit}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Pay</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Cancel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td className="p-4 text-sm">{formattedAmount}</td>
      <td className="p-4 text-sm">{expense.receiver ?? "N/A"}</td>
      <td className="p-4 text-sm">{formattedDate}</td>
      <td className="p-4 text-sm">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            statusColorClass
          )}
        >
          {expense.status}
        </span>
      </td>
    </tr>
  )
}
