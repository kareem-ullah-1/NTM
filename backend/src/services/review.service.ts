import { ProductModel } from "../models/product.model";
import { ProductReviewModel, type ProductReviewRecord, type ReviewStatus } from "../models/review.model";
import { UserModel, type UserRecord } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/pagination";
import { deleteImageFromR2 } from "../utils/r2Storage";
import { env } from "../config/env";

function serializeReview(row: ProductReviewRecord, author: UserRecord | undefined) {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    images: row.images,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    isGuest: row.user_id === null,
    userName: author?.name ?? row.guest_name ?? "Deleted user",
    userAvatarUrl: author?.avatar_url ?? null
  };
}

async function attachAuthors(rows: ProductReviewRecord[]) {
  const userIds = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => id !== null))];
  const authors = await UserModel.findByIds(userIds);
  const byId = new Map(authors.map((author) => [author.id, author]));
  return rows.map((row) => serializeReview(row, row.user_id ? byId.get(row.user_id) : undefined));
}

export const ReviewService = {
  async listForProduct(productSlug: string, page = 1, limit = 10) {
    const product = await ProductModel.findBySlug(productSlug);
    if (!product) throw ApiError.notFound("Product not found");

    const offset = (page - 1) * limit;
    const { rows, total } = await ProductReviewModel.findByProduct(product.id, limit, offset);

    return {
      data: await attachAuthors(rows),
      meta: buildMeta(page, limit, total),
      summary: { averageRating: parseFloat(product.rating), reviewCount: product.review_count }
    };
  },

  async getMyReviewForProduct(userId: string, productSlug: string) {
    const product = await ProductModel.findBySlug(productSlug);
    if (!product) throw ApiError.notFound("Product not found");
    const review = await ProductReviewModel.findByUserAndProduct(userId, product.id);
    if (!review) return null;
    const author = await UserModel.findById(userId);
    return serializeReview(review, author ?? undefined);
  },

    async submitReview(
    userId: string | null,
    productSlug: string,
    input: { rating: number; comment: string; images: string[]; name?: string; email?: string }
  ) {
    const product = await ProductModel.findBySlug(productSlug);
    if (!product) throw ApiError.notFound("Product not found");

    if (input.images.length > 0) {
      const allowedPrefix = env.r2PublicUrl;
      if (!allowedPrefix) throw ApiError.internal("R2 public URL is not configured.");
      const reviewFolder = "ntm-fabrics/reviews";
      const invalid = input.images.find((url) => {

        return !url.startsWith(`${allowedPrefix}/${reviewFolder}/`);
      });
      if (invalid) {
        throw ApiError.badRequest("Invalid image reference. Please re-upload images through the upload form.");
      }
    }

    if (!userId) {
      const guestName = input.name?.trim();
      const guestEmail = input.email?.trim().toLowerCase();
      if (!guestName || guestName.length < 2) {
        throw ApiError.badRequest("Name is required and must be at least 2 characters");
      }
      if (!guestEmail) {
        throw ApiError.badRequest("Email is required to submit a review");
      }

      const review = await ProductReviewModel.createGuestReview({
        productId: product.id,
        guestName,
        guestEmail,
        rating: input.rating,
        comment: input.comment,
        images: input.images
      });
      return serializeReview(review, undefined);
    }

    const existing = await ProductReviewModel.findByUserAndProduct(userId, product.id);

    const review = await ProductReviewModel.upsert({
      userId,
      productId: product.id,
      rating: input.rating,
      comment: input.comment,
      images: input.images
    });

    if (existing) {
      const removed = existing.images.filter((url) => !input.images.includes(url));
      await Promise.all(removed.map((url) => deleteImageFromR2(url)));
    }

    const author = await UserModel.findById(userId);
    return serializeReview(review, author ?? undefined);
  },

  async deleteOwnReview(userId: string, reviewId: string) {
    const review = await ProductReviewModel.findById(reviewId);
    if (!review) throw ApiError.notFound("Review not found");
    if (review.user_id !== userId) {
      throw ApiError.forbidden("You can only delete your own review");
    }
    await ProductReviewModel.delete(reviewId);
    await Promise.all(review.images.map((url) => deleteImageFromR2(url)));
  },

  async deleteAsAdmin(reviewId: string) {
    const review = await ProductReviewModel.findById(reviewId);
    if (!review) throw ApiError.notFound("Review not found");
    await ProductReviewModel.delete(reviewId);
    await Promise.all(review.images.map((url) => deleteImageFromR2(url)));
  },

  async updateStatusAsAdmin(reviewId: string, status: ReviewStatus) {
    const review = await ProductReviewModel.findById(reviewId);
    if (!review) throw ApiError.notFound("Review not found");
    const updated = await ProductReviewModel.updateStatus(reviewId, status);
    if (!updated) throw ApiError.notFound("Review not found");
    return updated;
  },

  async getStats() {
    return ProductReviewModel.getStats();
  },

  async listForAdmin(
    page = 1,
    limit = 20,
    filters?: {
      status?: ReviewStatus;
      rating?: number;
      search?: string;
    }
  ) {
    const offset = (page - 1) * limit;
    const { rows, total } = await ProductReviewModel.listForAdmin(limit, offset, filters);

    const [authors, products] = await Promise.all([
      UserModel.findByIds([...new Set(rows.map((row) => row.user_id).filter((id): id is string => id !== null))]),
      ProductModel.findByIds([...new Set(rows.map((row) => row.product_id))])
    ]);
    const authorsById = new Map(authors.map((author) => [author.id, author]));
    const productsById = new Map(products.map((product) => [product.id, product]));

    return {
      data: rows.map((row) => ({
        ...serializeReview(row, row.user_id ? authorsById.get(row.user_id) : undefined),
        userEmail: (row.user_id ? authorsById.get(row.user_id)?.email : row.guest_email) ?? null,
        productName: productsById.get(row.product_id)?.name ?? "Deleted product",
        productSlug: productsById.get(row.product_id)?.slug ?? null
      })),
      meta: buildMeta(page, limit, total)
    };
  }
};
