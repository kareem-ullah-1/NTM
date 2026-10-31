import { PoolClient } from "pg";
import { CouponModel, type CouponRecord } from "../models/coupon.model";
import { ApiError } from "../utils/ApiError";
import type { CouponCreateInput, CouponUpdateInput } from "../validators/coupon.validator";

function serializeCoupon(coupon: CouponRecord) {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discount_type,
    discountValue: parseFloat(coupon.discount_value),
    minOrderAmount: parseFloat(coupon.min_order_amount),
    maxDiscountAmount: coupon.max_discount_amount ? parseFloat(coupon.max_discount_amount) : null,
    usageLimit: coupon.usage_limit,
    perUserLimit: coupon.per_user_limit,
    usageCount: coupon.usage_count,
    isActive: coupon.is_active,
    startsAt: coupon.starts_at,
    expiresAt: coupon.expires_at,
    createdAt: coupon.created_at
  };
}

function computeDiscount(coupon: CouponRecord, subtotal: number): number {
  let discount: number;

  if (coupon.discount_type === "percentage") {
    discount = subtotal * (parseFloat(coupon.discount_value) / 100);
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
    }

    discount = Math.min(discount, subtotal);
  } else {

    discount = parseFloat(coupon.discount_value);
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
    }
    discount = Math.min(discount, subtotal);
  }

  return Math.round(discount * 100) / 100;
}

function assertEligible(coupon: CouponRecord, subtotal: number) {
  if (!coupon.is_active) {
    throw ApiError.badRequest("This coupon is no longer active");
  }
  const now = new Date();
  if (coupon.starts_at && now < new Date(coupon.starts_at)) {
    throw ApiError.badRequest("This coupon is not active yet");
  }
  if (coupon.expires_at && now > new Date(coupon.expires_at)) {
    throw ApiError.badRequest("This coupon has expired");
  }
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    throw ApiError.badRequest("This coupon has reached its usage limit");
  }
  if (subtotal < parseFloat(coupon.min_order_amount)) {
    throw ApiError.badRequest(`This coupon requires a minimum order of ${coupon.min_order_amount}`);
  }
}

export const CouponService = {
  async list() {
    const coupons = await CouponModel.findMany();
    return coupons.map(serializeCoupon);
  },

  async create(input: CouponCreateInput) {
    const existing = await CouponModel.findByCode(input.code);
    if (existing) throw ApiError.conflict(`A coupon with code "${input.code.toUpperCase()}" already exists`);

    const coupon = await CouponModel.create({
      code: input.code,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscountAmount: input.maxDiscountAmount,
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      isActive: input.isActive,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt
    });
    return serializeCoupon(coupon);
  },

  async update(id: string, input: CouponUpdateInput) {
    if (input.code) {
      const existing = await CouponModel.findByCode(input.code);
      if (existing && existing.id !== id) {
        throw ApiError.conflict(`A coupon with code "${input.code.toUpperCase()}" already exists`);
      }
    }
    const coupon = await CouponModel.update(id, input);
    if (!coupon) throw ApiError.notFound("Coupon not found");
    return serializeCoupon(coupon);
  },

  async setActive(id: string, isActive: boolean) {
    const coupon = await CouponModel.setActive(id, isActive);
    if (!coupon) throw ApiError.notFound("Coupon not found");
    return serializeCoupon(coupon);
  },

  async remove(id: string) {
    const removed = await CouponModel.remove(id);
    if (!removed) throw ApiError.notFound("Coupon not found");
  },

    async preview(code: string, subtotal: number, userId: string | null) {
    const coupon = await CouponModel.findByCode(code);
    if (!coupon) throw ApiError.badRequest("Invalid coupon code");

    assertEligible(coupon, subtotal);

    if (coupon.per_user_limit !== null) {
      if (!userId) throw ApiError.unauthorized("Sign in to use this coupon");
      const used = await CouponModel.countRedemptionsByUser(coupon.id, userId);
      if (used >= coupon.per_user_limit) {
        throw ApiError.badRequest("You have already used this coupon the maximum number of times");
      }
    }

    const discountAmount = computeDiscount(coupon, subtotal);
    return { code: coupon.code, discountAmount, discountType: coupon.discount_type };
  },

    async applyToOrder(
    client: PoolClient,
    input: { code: string; subtotal: number; userId: string | null; orderId: string }
  ): Promise<{ discountAmount: number; couponCode: string }> {
    const coupon = await CouponModel.findByCodeForUpdate(client, input.code);
    if (!coupon) throw ApiError.badRequest("Invalid coupon code");

    assertEligible(coupon, input.subtotal);

    if (coupon.per_user_limit !== null) {
      if (!input.userId) throw ApiError.unauthorized("Sign in to use this coupon");
      const used = await CouponModel.countRedemptionsByUser(coupon.id, input.userId);
      if (used >= coupon.per_user_limit) {
        throw ApiError.badRequest("You have already used this coupon the maximum number of times");
      }
    }

    const discountAmount = computeDiscount(coupon, input.subtotal);

    await CouponModel.recordRedemption(client, {
      couponId: coupon.id,
      userId: input.userId,
      orderId: input.orderId,
      discountAmount
    });

    return { discountAmount, couponCode: coupon.code };
  }
};
