import { CollectionModel, CollectionOptionModel } from "../models/collection.model";
import { ApiError } from "../utils/ApiError";
import type { CollectionCreateInput, CollectionUpdateInput } from "../validators/collection.validator";
import type { CollectionOptionCreateInput, CollectionOptionUpdateInput } from "../validators/collection.validator";

function serializeCollection(row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  display_order: number;
  is_enabled: boolean;
  nav_links: { label: string; href: string }[];
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    displayOrder: row.display_order,
    isEnabled: row.is_enabled,
    navLinks: row.nav_links ?? [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function serializeOption(row: {
  id: string;
  collection_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: row.id,
    collectionId: row.collection_id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export const CollectionService = {
  async list() {
    const rows = await CollectionModel.findAll();
    const collections = await Promise.all(
      rows.map(async (row) => {
        const productCount = await CollectionModel.countProducts(row.id);
        const productIds = await CollectionModel.getProducts(row.id);
        const options = await CollectionOptionModel.findByCollectionId(row.id);
        const optionsWithCounts = await Promise.all(
          options.map(async (opt) => ({
            ...serializeOption(opt),
            productCount: await CollectionOptionModel.countProducts(opt.id),
            productIds: await CollectionOptionModel.getProducts(opt.id)
          }))
        );
        return { ...serializeCollection(row), productCount, productIds, options: optionsWithCounts };
      })
    );
    return collections;
  },

  async listEnabled() {
    const rows = await CollectionModel.findEnabled();
    return Promise.all(
      rows.map(async (row) => {
        const options = await CollectionOptionModel.findActiveByCollectionId(row.id);
        return {
          ...serializeCollection(row),
          options: options.map(serializeOption)
        };
      })
    );
  },

  async getById(id: string) {
    const row = await CollectionModel.findById(id);
    if (!row) throw ApiError.notFound("Collection not found");
    const productCount = await CollectionModel.countProducts(id);
    const productIds = await CollectionModel.getProducts(id);
    const options = await CollectionOptionModel.findByCollectionId(id);
    const optionsWithCounts = await Promise.all(
      options.map(async (opt) => ({
        ...serializeOption(opt),
        productCount: await CollectionOptionModel.countProducts(opt.id),
        productIds: await CollectionOptionModel.getProducts(opt.id)
      }))
    );
    return { ...serializeCollection(row), productCount, productIds, options: optionsWithCounts };
  },

  async create(input: CollectionCreateInput) {
    const slug = input.slug || await CollectionModel.findOrCreateSlug(input.name);
    const existing = await CollectionModel.findBySlug(slug);
    if (existing) {
      throw ApiError.conflict(`A collection with the slug "${slug}" already exists`);
    }

    const created = await CollectionModel.create({
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      displayOrder: input.displayOrder,
      isEnabled: input.isEnabled,
      navLinks: input.navLinks
    });

    return { ...serializeCollection(created), productCount: 0, productIds: [], options: [] };
  },

  async update(id: string, input: CollectionUpdateInput) {
    const existing = await CollectionModel.findById(id);
    if (!existing) throw ApiError.notFound("Collection not found");

    let slug = input.slug;
    if (input.slug) {
      const duplicateSlug = await CollectionModel.findBySlug(input.slug);
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw ApiError.conflict(`A collection with the slug "${input.slug}" already exists`);
      }
    } else if (input.name && input.name !== existing.name) {
      slug = await CollectionModel.findOrCreateSlug(input.name);
    }

    const updated = await CollectionModel.update(id, {
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      displayOrder: input.displayOrder,
      isEnabled: input.isEnabled,
      navLinks: input.navLinks
    });

    if (!updated) throw ApiError.notFound("Collection not found");

    const productCount = await CollectionModel.countProducts(id);
    const productIds = await CollectionModel.getProducts(id);
    const options = await CollectionOptionModel.findByCollectionId(id);
    const optionsWithCounts = await Promise.all(
      options.map(async (opt) => ({
        ...serializeOption(opt),
        productCount: await CollectionOptionModel.countProducts(opt.id),
        productIds: await CollectionOptionModel.getProducts(opt.id)
      }))
    );
    return { ...serializeCollection(updated), productCount, productIds, options: optionsWithCounts };
  },

  async remove(id: string) {
    const existing = await CollectionModel.findById(id);
    if (!existing) throw ApiError.notFound("Collection not found");
    await CollectionModel.delete(id);
  }
};

export const CollectionOptionService = {
  async create(input: CollectionOptionCreateInput) {

    const collection = await CollectionModel.findById(input.collectionId);
    if (!collection) throw ApiError.notFound("Collection not found");

    const slug = input.slug || await CollectionOptionModel.findOrCreateSlug(input.collectionId, input.name);
    const existing = await CollectionOptionModel.findBySlug(input.collectionId, slug);
    if (existing) {
      throw ApiError.conflict(`An option with the slug "${slug}" already exists in this collection`);
    }

    const created = await CollectionOptionModel.create({
      collectionId: input.collectionId,
      name: input.name,
      slug,
      isActive: input.isActive
    });

    return { ...serializeOption(created), productCount: 0, productIds: [] };
  },

  async update(id: string, input: CollectionOptionUpdateInput) {
    const existing = await CollectionOptionModel.findById(id);
    if (!existing) throw ApiError.notFound("Collection option not found");

    let slug = input.slug;
    if (input.name && input.name !== existing.name && !input.slug) {
      slug = await CollectionOptionModel.findOrCreateSlug(existing.collection_id, input.name);
    }
    if (input.slug) {
      const duplicateSlug = await CollectionOptionModel.findBySlug(existing.collection_id, input.slug);
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw ApiError.conflict(`An option with the slug "${input.slug}" already exists in this collection`);
      }
    }

    const updated = await CollectionOptionModel.update(id, {
      name: input.name,
      slug,
      isActive: input.isActive
    });

    if (!updated) throw ApiError.notFound("Collection option not found");

    const productCount = await CollectionOptionModel.countProducts(id);
    const productIds = await CollectionOptionModel.getProducts(id);
    return { ...serializeOption(updated), productCount, productIds };
  },

  async remove(id: string) {
    const existing = await CollectionOptionModel.findById(id);
    if (!existing) throw ApiError.notFound("Collection option not found");
    await CollectionOptionModel.delete(id);
  }
};
