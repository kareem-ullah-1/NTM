import type { PoolClient } from "pg";
import { withTransaction } from "../config/db";
import { WalletModel, type WalletTransactionRecord } from "../models/wallet.model";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/pagination";

const REFERRAL_REWARD_REFERRER = 200;

const MAX_WALLET_REDEMPTION_RATE = 0.5;

function serializeTransaction(tx: WalletTransactionRecord) {
  return {
    id: tx.id,
    amount: parseFloat(tx.amount),
    balanceAfter: parseFloat(tx.balance_after),
    type: tx.type,
    orderId: tx.order_id,
    description: tx.description,
    createdAt: tx.created_at
  };
}

export const WalletService = {
    async rewardReferrerOnFirstOrder(userId: string, orderId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user?.referred_by_user_id) return;

    const alreadyRewarded = await WalletModel.hasReferralBeenRewarded(userId);
    if (alreadyRewarded) return;

    await withWalletClient(async (client) => {
      await WalletModel.applyTransaction(client, {
        userId: user.referred_by_user_id as string,
        amount: REFERRAL_REWARD_REFERRER,
        type: "referral_bonus_referrer",
        description: `Referral reward — your invite placed their first order (${orderId})`,
        orderId,
        relatedUserId: userId
      });
    });
  },

    async maxRedeemable(userId: string, subtotal: number): Promise<number> {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    const balance = parseFloat(user.wallet_balance);
    const cap = Math.floor(subtotal * MAX_WALLET_REDEMPTION_RATE);
    return Math.max(0, Math.min(balance, cap));
  },

    async redeemForOrder(client: PoolClient, userId: string, amount: number, orderId: string): Promise<void> {
    if (amount <= 0) return;
    await WalletModel.applyTransaction(client, {
      userId,
      amount: -amount,
      type: "order_redemption",
      description: `Applied to order ${orderId}`,
      orderId
    });
  },

    async refundOrderRedemption(client: PoolClient, userId: string, amount: number, orderId: string): Promise<void> {
    if (amount <= 0) return;
    await WalletModel.applyTransaction(client, {
      userId,
      amount,
      type: "order_redemption_refund",
      description: `Order ${orderId} cancelled — wallet credit refunded`,
      orderId
    });
  },

    async creditReturnRefund(userId: string, amount: number, orderId: string): Promise<void> {
    await withWalletClient(async (client) => {
      await WalletModel.applyTransaction(client, {
        userId,
        amount,
        type: "return_refund_credit",
        description: `Store credit refund for return on order ${orderId}`,
        orderId
      });
    });
  },

    async adminAdjust(userId: string, amount: number, reason: string): Promise<ReturnType<typeof serializeTransaction>> {
    const tx = await withWalletClient(async (client) =>
      WalletModel.applyTransaction(client, {
        userId,
        amount,
        type: "admin_adjustment",
        description: reason
      })
    );
    return serializeTransaction(tx);
  },

  async getHistory(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, total } = await WalletModel.findHistory(userId, limit, offset);
    return { data: rows.map(serializeTransaction), meta: buildMeta(page, limit, total) };
  }
};

async function withWalletClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  return withTransaction(fn);
}
