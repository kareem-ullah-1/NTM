import type { ApiOrder } from "@/lib/api/types";

export const statusVariant: Record<ApiOrder["status"], "success" | "warning" | "danger" | "muted" | "sand"> = {
  Delivered: "success",
  Shipped: "sand",
  Confirmed: "muted",
  Pending: "warning",
  Cancelled: "danger"
};

export const orderColumnLabels: Record<string, string> = {
  id: "Order ID",
  customerName: "Customer",
  date: "Date",
  amount: "Amount",
  paymentMethod: "Payment",
  status: "Status",
  action: "Action"
};
