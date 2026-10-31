import { CategoryModel, FabricTypeModel, ColorModel, HomeFeaturedCategoryModel } from "../models/catalog.model";
import { ApiError } from "../utils/ApiError";
import { invalidateColorCache } from "../config/colors";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  FabricTypeCreateInput,
  FabricTypeUpdateInput,
  ColorCreateInput,
  ColorUpdateInput
} from "../validators/catalog.validator";

function serializeCategory(row: { id: string; name: string; slug: string; image_url: string | null; is_enabled: boolean; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    isEnabled: row.is_enabled,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function serializeFabricType(row: { id: string; name: string; slug: string; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function serializeColor(row: { id: string; name: string; hex: string; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    name: row.name,
    hex: row.hex.toUpperCase(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export const CategoryService = {
  async list() {
    const rows = await CategoryModel.findAll();
    return rows.map(serializeCategory);
  },

  async listEnabled() {
    const rows = await CategoryModel.findAllEnabled();
    return rows.map(serializeCategory);
  },

  async create(input: CategoryCreateInput) {
    const existing = await CategoryModel.findByName(input.name);
    if (existing) {
      throw ApiError.conflict(`A category with the name "${input.name}" already exists`);
    }
    const created = await CategoryModel.create(input.name, {
      imageUrl: input.imageUrl,
      isEnabled: input.isEnabled
    });
    return serializeCategory(created);
  },

  async update(id: string, input: CategoryUpdateInput) {
    const existing = await CategoryModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    const name = input.name ?? existing.name;
    const duplicate = await CategoryModel.findByName(name);
    if (duplicate && duplicate.id !== id) {
      throw ApiError.conflict(`A category with the name "${name}" already exists`);
    }

    const updated = await CategoryModel.update(id, name, {
      imageUrl: input.imageUrl,
      isEnabled: input.isEnabled
    });
    if (!updated) throw ApiError.notFound("Category not found");
    return serializeCategory(updated);
  },

  async remove(id: string) {
    const existing = await CategoryModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    const usageCount = await CategoryModel.countProductsUsing(existing.name);
    if (usageCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${existing.name}" — it is currently used by ${usageCount} product(s). Reassign or remove those products first.`
      );
    }

    await CategoryModel.delete(id);
  }
};

export const FabricTypeService = {
  async list() {
    const rows = await FabricTypeModel.findAll();
    return rows.map(serializeFabricType);
  },

  async create(input: FabricTypeCreateInput) {
    const existing = await FabricTypeModel.findByName(input.name);
    if (existing) {
      throw ApiError.conflict(`A fabric type with the name "${input.name}" already exists`);
    }
    const created = await FabricTypeModel.create(input.name);
    return serializeFabricType(created);
  },

  async update(id: string, input: FabricTypeUpdateInput) {
    const existing = await FabricTypeModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Fabric type not found");
    }

    const duplicate = await FabricTypeModel.findByName(input.name);
    if (duplicate && duplicate.id !== id) {
      throw ApiError.conflict(`A fabric type with the name "${input.name}" already exists`);
    }

    const updated = await FabricTypeModel.update(id, input.name);
    if (!updated) throw ApiError.notFound("Fabric type not found");
    return serializeFabricType(updated);
  },

  async remove(id: string) {
    const existing = await FabricTypeModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Fabric type not found");
    }

    const usageCount = await FabricTypeModel.countProductsUsing(existing.name);
    if (usageCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${existing.name}" — it is currently used by ${usageCount} product(s). Reassign or remove those products first.`
      );
    }

    await FabricTypeModel.delete(id);
  }
};

export const ColorService = {
  async list() {
    const rows = await ColorModel.findAll();
    return rows.map(serializeColor);
  },

  async create(input: ColorCreateInput) {
    const existing = await ColorModel.findByName(input.name);
    if (existing) {
      throw ApiError.conflict(`A color with the name "${input.name}" already exists`);
    }
    const created = await ColorModel.create(input.name, input.hex);
    invalidateColorCache();
    return serializeColor(created);
  },

  async update(id: string, input: ColorUpdateInput) {
    const existing = await ColorModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Color not found");
    }

    const duplicate = await ColorModel.findByName(input.name);
    if (duplicate && duplicate.id !== id) {
      throw ApiError.conflict(`A color with the name "${input.name}" already exists`);
    }

    const updated = await ColorModel.update(id, input.name, input.hex);
    if (!updated) throw ApiError.notFound("Color not found");
    invalidateColorCache();
    return serializeColor(updated);
  },

  async remove(id: string) {
    const existing = await ColorModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Color not found");
    }

    const usageCount = await ColorModel.countProductsUsing(existing.name);
    if (usageCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${existing.name}" — it is currently used by ${usageCount} product(s). Reassign or remove those products first.`
      );
    }

    await ColorModel.delete(id);
    invalidateColorCache();
  },

    async lookupTable() {
    return ColorModel.findAllAsLookup();
  }
};

function serializeHomeFeatured(row: {
  id: string;
  category_id: string;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}, category?: { id: string; name: string; slug: string; image_url: string | null; is_enabled: boolean } | null) {
  return {
    id: row.id,
    categoryId: row.category_id,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          imageUrl: category.image_url,
          isEnabled: category.is_enabled
        }
      : null
  };
}

export const HomeFeaturedCategoryService = {
  async list() {
    let rows;
    try {
      rows = await HomeFeaturedCategoryModel.findAll();
    } catch (err: unknown) {

      const pgError = err as { code?: string };
      if (pgError.code === "42P01") return [];
      throw err;
    }
    const results = await Promise.all(
      rows.map(async (row) => {
        const cat = await CategoryModel.findById(row.category_id);
        return serializeHomeFeatured(row, cat);
      })
    );
    return results;
  },

  async listActive() {
    let rows;
    try {
      rows = await HomeFeaturedCategoryModel.findActive();
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError.code === "42P01") return [];
      throw err;
    }
    const results = await Promise.all(
      rows.map(async (row) => {
        const cat = await CategoryModel.findById(row.category_id);

        if (!cat || !cat.is_enabled) return null;
        return serializeHomeFeatured(row, cat);
      })
    );
    return results.filter(Boolean);
  },

  async create(input: { categoryId: string; imageUrl?: string | null; isActive?: boolean }) {

    const category = await CategoryModel.findById(input.categoryId);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    if (!input.imageUrl || input.imageUrl.trim() === "") {
      throw ApiError.badRequest("Product image is required");
    }

    const existing = await HomeFeaturedCategoryModel.findByCategoryId(input.categoryId);
    if (existing) {
      throw ApiError.conflict(`"${category.name}" is already a Home Featured Category`);
    }

    const created = await HomeFeaturedCategoryModel.create(input);
    return serializeHomeFeatured(created, category);
  },

  async update(id: string, input: { imageUrl?: string | null; isActive?: boolean }) {
    const existing = await HomeFeaturedCategoryModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Home Featured Category not found");
    }

    if (input.imageUrl !== undefined && (!input.imageUrl || input.imageUrl.trim() === "")) {
      throw ApiError.badRequest("Product image is required");
    }

    const updated = await HomeFeaturedCategoryModel.update(id, input);
    if (!updated) throw ApiError.notFound("Home Featured Category not found");

    const cat = await CategoryModel.findById(updated.category_id);
    return serializeHomeFeatured(updated, cat);
  },

  async remove(id: string) {
    const existing = await HomeFeaturedCategoryModel.findById(id);
    if (!existing) {
      throw ApiError.notFound("Home Featured Category not found");
    }
    await HomeFeaturedCategoryModel.delete(id);
  }
};
