import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ExpenseRow } from "../ExpenseRow"
import type { ExpenseDTO } from "@/types/expenses"
import { ExpenseStatus } from "@/constants/expenses"

describe("ExpenseRow", () => {
  const mockExpense: ExpenseDTO = {
    id: "expense-1",
    organizationId: "org-1",
    categoryId: "cat-1",
    description: "Test Expense",
    amount: 1234.56,
    currency: "BRL",
    dueDate: new Date("2024-01-15"),
    status: ExpenseStatus.OPEN,
    paymentMethod: null,
    paymentProof: null,
    paymentProofUrl: null,
    receiver: "Test Receiver",
    municipality: "Test City",
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  }

  describe("Currency Formatting", () => {
    it("correctly formats amounts to BRL", () => {
      render(<ExpenseRow expense={mockExpense} />)
      expect(screen.getByText("R$ 1.234,56")).toBeInTheDocument()
    })

    it("handles zero amounts", () => {
      const zeroExpense = { ...mockExpense, amount: 0 }
      render(<ExpenseRow expense={zeroExpense} />)
      expect(screen.getByText("R$ 0,00")).toBeInTheDocument()
    })

    it("handles large amounts", () => {
      const largeExpense = { ...mockExpense, amount: 9999999.99 }
      render(<ExpenseRow expense={largeExpense} />)
      expect(screen.getByText("R$ 9.999.999,99")).toBeInTheDocument()
    })

    it("handles small decimal amounts", () => {
      const smallExpense = { ...mockExpense, amount: 0.01 }
      render(<ExpenseRow expense={smallExpense} />)
      expect(screen.getByText("R$ 0,01")).toBeInTheDocument()
    })
  })

  describe("Date Formatting", () => {
    it("correctly formats dates to dd/MM/yyyy", () => {
      render(<ExpenseRow expense={mockExpense} />)
      expect(screen.getByText(/14\/01\/2024|15\/01\/2024/)).toBeInTheDocument()
    })

    it("handles different dates", () => {
      const otherExpense = {
        ...mockExpense,
        dueDate: new Date("2025-12-31"),
      }
      render(<ExpenseRow expense={otherExpense} />)
      expect(screen.getByText(/30\/12\/2025|31\/12\/2025/)).toBeInTheDocument()
    })

    it("handles null/undefined dates", () => {
      const nullDateExpense = {
        ...mockExpense,
        dueDate: null as unknown as Date,
      }
      render(<ExpenseRow expense={nullDateExpense} />)
      expect(screen.getByText("N/A")).toBeInTheDocument()
    })
  })

  describe("Component Rendering", () => {
    it("renders all expense data fields", () => {
      render(<ExpenseRow expense={mockExpense} />)
      expect(screen.getByText(/R\$\s*1\.234,56/)).toBeInTheDocument()
      expect(screen.getByText("Test Receiver")).toBeInTheDocument()
      expect(screen.getByText(/14\/01\/2024|15\/01\/2024/)).toBeInTheDocument()
      expect(screen.getByText("OPEN")).toBeInTheDocument()
    })

    it("renders columns in correct order", () => {
      const { container } = render(<ExpenseRow expense={mockExpense} />)
      const cells = container.querySelectorAll("td")
      expect(cells).toHaveLength(5)
      expect(cells[0].querySelector("button")).toBeInTheDocument()
      expect(cells[1].textContent).toContain("R$")
      expect(cells[1].textContent).toContain("1.234,56")
      expect(cells[2].textContent).toBe("Test Receiver")
      expect(cells[3].textContent).toMatch(/14\/01\/2024|15\/01\/2024/)
      expect(cells[4].textContent).toBe("OPEN")
    })

    it("renders Fornecedor column with receiver value", () => {
      render(<ExpenseRow expense={mockExpense} />)
      expect(screen.getByText("Test Receiver")).toBeInTheDocument()
    })

    it("handles null receiver with N/A fallback", () => {
      const nullReceiverExpense = { ...mockExpense, receiver: null as unknown as string }
      render(<ExpenseRow expense={nullReceiverExpense} />)
      expect(screen.getByText("N/A")).toBeInTheDocument()
    })

    it("renders actions column as first column with dropdown button", () => {
      const { container } = render(<ExpenseRow expense={mockExpense} />)
      const firstCell = container.querySelector("td:first-child")
      expect(firstCell?.querySelector("button")).toBeInTheDocument()
    })

    it("renders dropdown trigger button with MoreVertical icon", () => {
      render(<ExpenseRow expense={mockExpense} />)
      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()
      expect(screen.getByTestId("morevertical-icon")).toBeInTheDocument()
    })
  })

  describe("Status Badge", () => {
    it("displays correct color for OPEN status", () => {
      const openExpense = { ...mockExpense, status: ExpenseStatus.OPEN }
      render(<ExpenseRow expense={openExpense} />)
      const statusBadge = screen.getByText("OPEN")
      expect(statusBadge.className).toContain("bg-blue-100")
      expect(statusBadge.className).toContain("text-blue-800")
    })

    it("displays correct color for OVERDUE status", () => {
      const overdueExpense = {
        ...mockExpense,
        status: ExpenseStatus.OVERDUE,
      }
      render(<ExpenseRow expense={overdueExpense} />)
      const statusBadge = screen.getByText("OVERDUE")
      expect(statusBadge.className).toContain("bg-red-100")
      expect(statusBadge.className).toContain("text-red-800")
    })

    it("displays correct color for PAID status", () => {
      const paidExpense = { ...mockExpense, status: ExpenseStatus.PAID }
      render(<ExpenseRow expense={paidExpense} />)
      const statusBadge = screen.getByText("PAID")
      expect(statusBadge.className).toContain("bg-green-100")
      expect(statusBadge.className).toContain("text-green-800")
    })

    it("displays correct color for CANCELLED status", () => {
      const cancelledExpense = {
        ...mockExpense,
        status: ExpenseStatus.CANCELLED,
      }
      render(<ExpenseRow expense={cancelledExpense} />)
      const statusBadge = screen.getByText("CANCELLED")
      expect(statusBadge.className).toContain("bg-gray-100")
      expect(statusBadge.className).toContain("text-gray-800")
    })
  })

  describe("Dropdown Menu", () => {
    it("renders dropdown menu with all three actions", async () => {
      const user = userEvent.setup()
      render(<ExpenseRow expense={mockExpense} />)
      const button = screen.getByRole("button")
      await user.click(button)
      expect(screen.getByText("Edit")).toBeInTheDocument()
      expect(screen.getByText("Pay")).toBeInTheDocument()
      expect(screen.getByText("Cancel")).toBeInTheDocument()
    })

    it("dropdown items are clickable", async () => {
      const user = userEvent.setup()
      render(<ExpenseRow expense={mockExpense} />)
      const button = screen.getByRole("button")
      await user.click(button)
      const editItem = screen.getByText("Edit")
      expect(editItem).toHaveClass("cursor-pointer")
    })

    it("dropdown closes when clicking an item (UI placeholder, no action executed)", async () => {
      const user = userEvent.setup()
      render(<ExpenseRow expense={mockExpense} />)
      const button = screen.getByRole("button")
      await user.click(button)
      const editItem = screen.getByText("Edit")
      await user.click(editItem)
      expect(screen.queryByText("Edit")).not.toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("handles expense with null amount", () => {
      const nullAmountExpense = {
        ...mockExpense,
        amount: null as unknown as number,
      }
      render(<ExpenseRow expense={nullAmountExpense} />)
      expect(screen.getByText("R$ 0,00")).toBeInTheDocument()
    })

    it("handles expense with undefined amount", () => {
      const undefinedAmountExpense = {
        ...mockExpense,
        amount: undefined as unknown as number,
      }
      render(<ExpenseRow expense={undefinedAmountExpense} />)
      expect(screen.getByText(/R\$\s*0,00/)).toBeInTheDocument()
    })

    it("handles expense with invalid date", () => {
      const invalidDateExpense = {
        ...mockExpense,
        dueDate: new Date("invalid"),
      }
      render(<ExpenseRow expense={invalidDateExpense} />)
      const dateCell = screen.getByText("N/A")
      expect(dateCell).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("is accessible by keyboard (Tab, Enter, ESC)", async () => {
      const user = userEvent.setup()
      render(<ExpenseRow expense={mockExpense} />)
      const button = screen.getByRole("button")
      await user.tab()
      expect(document.activeElement).toBe(button)
      await user.keyboard("{Enter}")
      expect(screen.getByText("Edit")).toBeInTheDocument()
      await user.keyboard("{Escape}")
      expect(screen.queryByText("Edit")).not.toBeInTheDocument()
    })

    it("has proper ARIA labels", () => {
      render(<ExpenseRow expense={mockExpense} />)
      const button = screen.getByRole("button", { name: /open menu/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe("Responsive Design", () => {
    it("renders with horizontal scroll for mobile (table structure)", () => {
      const { container } = render(<ExpenseRow expense={mockExpense} />)
      const row = container.querySelector("tr")
      expect(row).toBeInTheDocument()
      expect(row).toHaveClass("border-b")
    })
  })
})
