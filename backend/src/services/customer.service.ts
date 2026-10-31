import { CustomerModel, type CustomerRow } from "../models/customer.model";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/pagination";

function serializeCustomer(row: CustomerRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    walletBalance: parseFloat(row.wallet_balance),
    referralCode: row.referral_code,
    orderCount: parseInt(row.order_count, 10),
    totalSpent: parseFloat(row.total_spent),
    createdAt: row.created_at.toISOString()
  };
}

export const CustomerService = {
  async list(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const { rows, total } = await CustomerModel.findMany({ search: query.search, limit, offset });

    return { data: rows.map(serializeCustomer), meta: buildMeta(page, limit, total) };
  },

  async getById(id: string) {
    const customer = await CustomerModel.findById(id);
    if (!customer) throw ApiError.notFound("Customer not found");
    return serializeCustomer(customer);
  }
};
