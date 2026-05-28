import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CategoryType } from '@ew/shared';
import { CategoryTranslation } from '../../entities/category-translation.entity';

interface GetCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  active?: boolean | null;
  type?: CategoryType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  locale?: string;
}

export interface CategoryTranslationData {
  locale: string;
  name: string;
  slug: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
}

export interface CreateCategoryData {
  type: CategoryType;
  active: boolean;
  icon?: string | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  translations: CategoryTranslationData[];
}

export interface UpdateCategoryData {
  type?: CategoryType;
  active?: boolean;
  icon?: string | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  translations?: CategoryTranslationData[];
}

@Injectable()
export class CategoryAdminService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly categoryTranslationRepository: Repository<CategoryTranslation>
  ) {}

  private async checkDuplicateSlug(slug: string, locale: string, excludeCategoryId?: number): Promise<boolean> {
    const queryBuilder = this.categoryTranslationRepository
      .createQueryBuilder('translation')
      .where('translation.slug = :slug', { slug })
      .andWhere('translation.locale = :locale', { locale });

    if (excludeCategoryId) {
      queryBuilder.andWhere('translation.categoryId != :categoryId', { categoryId: excludeCategoryId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  async getAllCategories(options?: { where?: FindOptionsWhere<Category> }) {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translations');

    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`category.${key} = :${key}`, { [key]: value });
      });
    }

    return queryBuilder
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('parent.translations', 'parentTranslations')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('children.translations', 'childrenTranslations')
      .leftJoinAndSelect('category.posts', 'posts')
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Category> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('parent.translations', 'parentTranslations')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('children.translations', 'childrenTranslations')
      .leftJoinAndSelect('category.posts', 'posts')
      .where('category.id = :id', { id })
      .getOneOrFail();
  }

  async findFeatured(): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.posts', 'posts')
      .where('category.isFeatured = :isFeatured', { isFeatured: true })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findRootCategories(): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('children.translations', 'childrenTranslations')
      .where('category.parentId IS NULL')
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findChildCategories(parentId: number): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translations')
      .where('category.parentId = :parentId', { parentId })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async create(data: CreateCategoryData): Promise<Category> {
    // Check for duplicate slugs
    for (const translation of data.translations) {
      const isDuplicate = await this.checkDuplicateSlug(translation.slug, translation.locale);
      if (isDuplicate) {
        throw new Error(`Slug "${translation.slug}" already exists for locale "${translation.locale}"`);
      }
    }

    const category = this.categoryRepository.create({
      type: data.type,
      active: data.active,
      icon: data.icon,
      priceRangeMin: data.priceRangeMin == null ? null : String(data.priceRangeMin),
      priceRangeMax: data.priceRangeMax == null ? null : String(data.priceRangeMax),
      translations: data.translations.map(translation => {
        const newTranslation = new CategoryTranslation();
        newTranslation.locale = translation.locale;
        newTranslation.name = translation.name;
        newTranslation.slug = translation.slug;
        newTranslation.description = translation.description;
        newTranslation.metaTitle = translation.metaTitle;
        newTranslation.metaDescription = translation.metaDescription;
        newTranslation.metaKeywords = translation.metaKeywords;
        newTranslation.ogTitle = translation.ogTitle;
        newTranslation.ogDescription = translation.ogDescription;
        newTranslation.ogImage = translation.ogImage;
        newTranslation.canonicalUrl = translation.canonicalUrl;
        return newTranslation;
      })
    });
    return this.categoryRepository.save(category);
  }

  async update(id: number, categoryData: Partial<Category>): Promise<Category> {
    await this.categoryRepository.update(id, categoryData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  async toggleFeatured(id: number): Promise<Category> {
    const category = await this.findOne(id);
    category.isFeatured = !category.isFeatured;
    return this.categoryRepository.save(category);
  }

  async getCategories({
    page,
    limit,
    search = '',
    active = null,
    type,
    sortBy = 'id',
    sortOrder = 'desc',
    locale
  }: GetCategoriesParams) {
    try {
      console.log('Getting categories with params:', { page, limit, search, active, type, sortBy, sortOrder, locale });
      
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.translations', 'translations');

      if (search) {
        queryBuilder.andWhere(
          '(LOWER(translations.name) LIKE LOWER(:search) OR LOWER(translations.slug) LIKE LOWER(:search))',
          { search: `%${search}%` }
        );
      }

      if (active !== null) {
        queryBuilder.andWhere('category.active = :active', { active });
      }

      if (type) {
        queryBuilder.andWhere('category.type = :type', { type });
      }

      if (locale) {
        queryBuilder.andWhere('translations.locale = :locale', { locale });
      }

      // Add sorting
      if (sortBy === 'name') {
        queryBuilder.orderBy('translations.name', sortOrder.toUpperCase() as 'ASC' | 'DESC');
      } else if (sortBy === 'type') {
        queryBuilder.orderBy('category.type', sortOrder.toUpperCase() as 'ASC' | 'DESC');
      } else {
        queryBuilder.orderBy(`category.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
      }

      // Add pagination
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit);

      console.log('Generated SQL:', queryBuilder.getSql());

      const [items, total] = await queryBuilder.getManyAndCount();

      console.log('Query results:', { total, itemsCount: items.length });

      return {
        items,
        total
      };
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['translations']
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Delete translations first
    await this.categoryTranslationRepository.remove(category.translations);

    // Then delete the category
    await this.categoryRepository.remove(category);
  }

  async updateCategory(id: number, data: UpdateCategoryData) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['translations']
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Update basic fields
    if (data.type !== undefined) category.type = data.type;
    if (data.active !== undefined) category.active = data.active;
    if (data.icon !== undefined) category.icon = data.icon;
    if (data.priceRangeMin !== undefined) category.priceRangeMin = data.priceRangeMin === null ? null : String(data.priceRangeMin);
    if (data.priceRangeMax !== undefined) category.priceRangeMax = data.priceRangeMax === null ? null : String(data.priceRangeMax);

    // Update translations if provided
    if (data.translations) {
      // Check for duplicate slugs, excluding current category
      for (const translation of data.translations) {
        const isDuplicate = await this.checkDuplicateSlug(translation.slug, translation.locale, id);
        if (isDuplicate) {
          throw new Error(`Slug "${translation.slug}" already exists for locale "${translation.locale}"`);
        }
      }

      // Remove existing translations
      await this.categoryTranslationRepository.remove(category.translations);

      // Create new translations
      category.translations = data.translations.map(translation => {
        const newTranslation = new CategoryTranslation();
        newTranslation.locale = translation.locale;
        newTranslation.name = translation.name;
        newTranslation.slug = translation.slug;
        newTranslation.description = translation.description;
        newTranslation.metaTitle = translation.metaTitle;
        newTranslation.metaDescription = translation.metaDescription;
        newTranslation.metaKeywords = translation.metaKeywords;
        newTranslation.ogTitle = translation.ogTitle;
        newTranslation.ogDescription = translation.ogDescription;
        newTranslation.ogImage = translation.ogImage;
        newTranslation.canonicalUrl = translation.canonicalUrl;
        newTranslation.category = category;
        return newTranslation;
      });
    }

    // Save the updated category
    return this.categoryRepository.save(category);
  }
} 
