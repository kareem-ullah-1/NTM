import { PoolClient } from "pg";
import { ProductDropModel, type ProductDropRecord } from "../models/product-drop.model";
import { ProductModel } from "../models/product.model";
import { PromotionModel } from "../models/promotion.model";
import { DropNotificationModel } from "../models/drop-notification.model";
import { ApiError } from "../utils/ApiError";
import type { ProductDropCreateInput, ProductDropUpdateInput } from "../validators/product-drop.validator";
import type { ProductDropListParams } from "../models/product-drop.model";

function serializeDrop(drop: ProductDropRecord) {
  return {
    id: drop.id,
    productId: drop.product_id,
    name: drop.name,
    description: drop.description,
    startsAt: drop.starts_at,
    endsAt: drop.ends_at,
    maxQuantity: drop.max_quantity,
    perCustomerLimit: drop.per_customer_limit,
    soldQuantity: drop.sold_quantity,
    remainingQuantity: drop.max_quantity - drop.sold_quantity,
    specialPrice: drop.special_price ? parseFloat(drop.special_price) : null,
    promotionId: drop.promotion_id,
    isActive: drop.is_active,
    createdAt: drop.created_at
  };
}

function getDropStatus(drop: ProductDropRecord): "draft" | "upcoming" | "live" | "sold_out" | "ended" | "disabled" {
  if (!drop.is_active) return "disabled";
  const now = new Date();
  if (now < new Date(drop.starts_at)) return "upcoming";
  if (drop.sold_quantity >= drop.max_quantity) return "sold_out";
  if (now > new Date(drop.ends_at)) return "ended";
  return "live";
}

export const ProductDropService = {
  async list(params: ProductDropListParams) {
    const { rows: drops, total } = await ProductDropModel.findManyPaginated(params);

    const results = [];
    for (const drop of drops) {
      const product = await ProductModel.findById(drop.product_id);
      results.push({
        ...serializeDrop(drop),
        status: getDropStatus(drop),
        product: product
          ? { name: product.name, slug: product.slug, price: parseFloat(product.price), images: product.images }
          : null
      });
    }

    const totalPages = Math.ceil(total / params.limit);
    return {
      data: results,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      }
    };
  },

  async create(input: ProductDropCreateInput) {
    const product = await ProductModel.findById(input.productId);
    if (!product) throw ApiError.badRequest("Product not found");

    if (input.specialPrice !== null && input.specialPrice !== undefined) {
      if (input.specialPrice <= 0) {
        throw ApiError.badRequest("Drop price must be greater than 0");
      }
      if (input.specialPrice >= parseFloat(product.price)) {
        throw ApiError.badRequest("Drop price must be less than the product's regular price");
      }
    }

    const overlapping = await ProductDropModel.hasOverlappingDrop(
      input.productId,
      input.startsAt,
      input.endsAt
    );
    if (overlapping) {
      throw ApiError.badRequest(
        `This product already has an overlapping Product Drop ("${overlapping.name}")`
      );
    }

    if (input.promotionId) {
      const promo = await PromotionModel.findById(input.promotionId);
      if (!promo) throw ApiError.badRequest("Promotion not found");
    }

    const drop = await ProductDropModel.create({
      productId: input.productId,
      name: input.name,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxQuantity: input.maxQuantity,
      perCustomerLimit: input.perCustomerLimit,
      specialPrice: input.specialPrice,
      promotionId: input.promotionId,
      isActive: input.isActive
    });
    return serializeDrop(drop);
  },

  async update(id: string, input: ProductDropUpdateInput) {
    const existingDrop = await ProductDropModel.findById(id);
    if (!existingDrop) throw ApiError.notFound("Product drop not found");

    if (input.productId) {
      const product = await ProductModel.findById(input.productId);
      if (!product) throw ApiError.badRequest("Product not found");
    }

    if (input.maxQuantity !== undefined && input.maxQuantity < existingDrop.sold_quantity) {
      throw ApiError.badRequest(
        `Drop quantity (${input.maxQuantity}) cannot be lower than units already sold (${existingDrop.sold_quantity})`
      );
    }

    if (input.specialPrice !== undefined && input.specialPrice !== null) {
      if (input.specialPrice <= 0) {
        throw ApiError.badRequest("Drop price must be greater than 0");
      }
      const productId = input.productId ?? existingDrop.product_id;
      const product = await ProductModel.findById(productId);
      if (product && input.specialPrice >= parseFloat(product.price)) {
        throw ApiError.badRequest("Drop price must be less than the product's regular price");
      }
    }

    if (input.productId || input.startsAt || input.endsAt) {
      const productId = input.productId ?? existingDrop.product_id;
      const startsAt = input.startsAt ?? existingDrop.starts_at.toISOString();
      const endsAt = input.endsAt ?? existingDrop.ends_at.toISOString();

      const overlapping = await ProductDropModel.hasOverlappingDrop(
        productId,
        startsAt,
        endsAt,
        id
      );
      if (overlapping) {
        throw ApiError.badRequest(
          `This product already has an overlapping Product Drop ("${overlapping.name}")`
        );
      }
    }

    if (input.promotionId) {
      const promo = await PromotionModel.findById(input.promotionId);
      if (!promo) throw ApiError.badRequest("Promotion not found");
    }

    const drop = await ProductDropModel.update(id, {
      productId: input.productId,
      name: input.name,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxQuantity: input.maxQuantity,
      perCustomerLimit: input.perCustomerLimit,
      specialPrice: input.specialPrice,
      promotionId: input.promotionId,
      isActive: input.isActive
    });
    if (!drop) throw ApiError.notFound("Product drop not found");
    return serializeDrop(drop);
  },

  async setActive(id: string, isActive: boolean) {
    const drop = await ProductDropModel.setActive(id, isActive);
    if (!drop) throw ApiError.notFound("Product drop not found");
    return serializeDrop(drop);
  },

  async remove(id: string) {
    const drop = await ProductDropModel.findById(id);
    if (!drop) throw ApiError.notFound("Product drop not found");

    const purchaseCount = await ProductDropModel.countPurchasesByDropId(id);
    if (purchaseCount > 0) {
      throw ApiError.badRequest(
        "Cannot delete a Product Drop that has purchase history. Disable it instead."
      );
    }

    const removed = await ProductDropModel.remove(id);
    if (!removed) throw ApiError.notFound("Product drop not found");
  },

  async getById(id: string) {
    const drop = await ProductDropModel.findById(id);
    if (!drop) throw ApiError.notFound("Product drop not found");
    const product = await ProductModel.findById(drop.product_id);
    const analytics = await ProductDropModel.getAnalytics(id);

    let promotion = null;
    if (drop.promotion_id) {
      const promo = await PromotionModel.findById(drop.promotion_id);
      if (promo) {
        promotion = {
          id: promo.id,
          name: promo.name,
          discountType: promo.discount_type,
          discountValue: parseFloat(promo.discount_value)
        };
      }
    }

    const notificationCount = await DropNotificationModel.countByDropId(id);

    return {
      ...serializeDrop(drop),
      status: getDropStatus(drop),
      product: product
        ? {
            name: product.name,
            slug: product.slug,
            price: parseFloat(product.price),
            images: product.images,
            stock: product.stock,
            sku: product.sku
          }
        : null,
      promotion,
      analytics,
      notificationCount
    };
  },

  async validateAndRecordPurchase(
    client: PoolClient,
    dropId: string,
    quantity: number,
    userId: string | null,
    orderId: string
  ): Promise<{ drop: ProductDropRecord; effectivePrice: number }> {
    const drop = await ProductDropModel.findByIdForUpdate(client, dropId);
    if (!drop) throw ApiError.badRequest("Product drop not found");
    if (!drop.is_active) throw ApiError.badRequest("This product drop is not currently available");

    const now = new Date();
    if (now < new Date(drop.starts_at)) throw ApiError.badRequest("This product drop has not started yet");
    if (now > new Date(drop.ends_at)) throw ApiError.badRequest("This product drop has ended");

    const remaining = drop.max_quantity - drop.sold_quantity;
    if (remaining < quantity) {
      throw ApiError.badRequest(
        remaining === 0
          ? `This drop has sold out`
          : `Only ${remaining} unit(s) remaining for "${drop.name}" (you requested ${quantity})`
      );
    }

    if (userId && drop.per_customer_limit > 0) {
      const alreadyPurchased = await ProductDropModel.countDropPurchasesByUserWithClient(
        client,
        dropId,
        userId
      );
      if (alreadyPurchased + quantity > drop.per_customer_limit) {
        throw ApiError.badRequest(
          `You have reached the purchase limit for "${drop.name}". You can purchase at most ${drop.per_customer_limit} unit(s).`
        );
      }
    }

    const updated = await ProductDropModel.decrementQuantityWithClient(client, dropId, quantity);
    if (!updated) {
      throw ApiError.badRequest("This drop has sold out");
    }

    await ProductDropModel.recordPurchaseWithClient(client, dropId, userId, orderId, quantity);

    const product = await ProductModel.findById(drop.product_id);
    if (!product) throw ApiError.badRequest("Associated product not found");

    let effectivePrice = parseFloat(product.price);
    if (drop.special_price !== null) {
      effectivePrice = parseFloat(drop.special_price);
    }

    if (drop.promotion_id) {
      const promo = await PromotionModel.findById(drop.promotion_id);
      if (promo && promo.is_active && now >= new Date(promo.starts_at) && now <= new Date(promo.expires_at)) {
        const promoDiscount =
          promo.discount_type === "percentage"
            ? effectivePrice * (parseFloat(promo.discount_value) / 100)
            : parseFloat(promo.discount_value);
        effectivePrice = Math.max(0, effectivePrice - promoDiscount);
      }
    }

    return { drop: updated, effectivePrice };
  },

  async validatePurchase(
    client: PoolClient,
    dropId: string,
    quantity: number,
    userId: string | null
  ): Promise<{ drop: ProductDropRecord; effectivePrice: number }> {
    return this.validateAndRecordPurchase(client, dropId, quantity, userId, "");
  },

  async recordPurchase(
    client: PoolClient,
    dropId: string,
    userId: string | null,
    orderId: string,
    quantity: number
  ): Promise<void> {
    await ProductDropModel.recordPurchaseWithClient(client, dropId, userId, orderId, quantity);
  },

  async getPublicDrops() {
    const now = new Date();
    const live = await ProductDropModel.findLive(now);
    const upcoming = await ProductDropModel.findUpcoming(now);

    const enrich = async (drops: ProductDropRecord[]) => {
      const results = [];
      for (const drop of drops) {
        const product = await ProductModel.findById(drop.product_id);
        const status = getDropStatus(drop);
        let promotion = null;
        if (drop.promotion_id) {
          const promo = await PromotionModel.findById(drop.promotion_id);
          if (promo) {
            promotion = {
              name: promo.name,
              discountType: promo.discount_type,
              discountValue: parseFloat(promo.discount_value)
            };
          }
        }
        results.push({
          ...serializeDrop(drop),
          status,
          product: product
            ? { name: product.name, slug: product.slug, price: parseFloat(product.price), images: product.images }
            : null,
          promotion
        });
      }
      return results;
    };

    return {
      live: await enrich(live),
      upcoming: await enrich(upcoming)
    };
  },

  async getForProduct(productId: string) {
    const drop = await ProductDropModel.findByProductId(productId);
    if (!drop) return null;
    const product = await ProductModel.findById(drop.product_id);
    const status = getDropStatus(drop);
    return {
      ...serializeDrop(drop),
      status,
      product: product ? { name: product.name, slug: product.slug, price: parseFloat(product.price) } : null
    };
  },

  async subscribeToNotification(
    dropId: string,
    email: string,
    userId?: string | null
  ) {
    const drop = await ProductDropModel.findById(dropId);
    if (!drop) throw ApiError.notFound("Product drop not found");

    const result = await DropNotificationModel.subscribe(dropId, email, userId ?? null);
    return {
      subscribed: true,
      alreadySubscribed: result.alreadySubscribed,
      message: result.alreadySubscribed
        ? "You are already subscribed to this drop."
        : "You will be notified when this drop goes live."
    };
  },

  async processDropNotifications(dropId: string): Promise<{ notified: number }> {
    const pendingSubscribers = await DropNotificationModel.findPendingByDropId(dropId);

    if (pendingSubscribers.length === 0) {
      return { notified: 0 };
    }

    const notified = await DropNotificationModel.markAllNotifiedForDrop(dropId);

    for (const subscriber of pendingSubscribers) {
      console.log(
        `[Notification] Drop "${dropId}" is now live — notifying ${subscriber.email}`
      );
    }

    return { notified };
  }
};
