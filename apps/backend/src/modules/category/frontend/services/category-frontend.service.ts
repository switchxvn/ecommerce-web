import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CategoryType } from '@ew/shared';

@Injectable()
export class CategoryFrontendService {
  private readonly baseSelect: string[] = [
    'category.id',
    'category.active',
    'category.isFeatured',
    'category.type',
    'category.parentId',
    'category.createdAt',
    'category.updatedAt',
  ];

  private buildSelectForAlias(alias: string): string[] {
    return [
      `${alias}.id`,
      `${alias}.active`,
      `${alias}.isFeatured`,
      `${alias}.type`,
      `${alias}.parentId`,
      `${alias}.createdAt`,
      `${alias}.updatedAt`,
    ];
  }

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(locale: string = 'vi'): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select(this.baseSelect)
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.posts', 'posts')
      .where('category.active = :active', { active: true })
      .andWhere('translations.locale = :locale', { locale })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findByType(type: CategoryType, locale: string = 'vi'): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select(this.baseSelect)
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.posts', 'posts')
      .leftJoinAndSelect('category.products', 'products')
      .where('category.active = :active', { active: true })
      .andWhere('(category.type = :type OR category.type = :bothType)', { 
        type, 
        bothType: CategoryType.BOTH 
      })
      .andWhere('translations.locale = :locale', { locale })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findOne(id: number, locale: string = 'vi'): Promise<Category> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select(this.baseSelect)
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.posts', 'posts')
      .leftJoin('category.parent', 'parent')
      .addSelect(this.buildSelectForAlias('parent'))
      .leftJoinAndSelect('parent.translations', 'parentTranslations')
      .leftJoin('category.children', 'children')
      .addSelect(this.buildSelectForAlias('children'))
      .leftJoinAndSelect('children.translations', 'childrenTranslations')
      .where('category.id = :id', { id })
      .andWhere('category.active = :active', { active: true })
      .andWhere('translations.locale = :locale', { locale })
      .andWhere('(parentTranslations.locale = :locale OR parentTranslations.locale IS NULL)', { locale })
      .andWhere('(childrenTranslations.locale = :locale OR childrenTranslations.locale IS NULL)', { locale })
      .getOneOrFail();
  }

  async findBySlug(slug: string, locale: string = 'vi'): Promise<Category> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select(this.baseSelect)
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.posts', 'posts')
      .leftJoin('category.parent', 'parent')
      .addSelect(this.buildSelectForAlias('parent'))
      .leftJoinAndSelect('parent.translations', 'parentTranslations')
      .leftJoin('category.children', 'children')
      .addSelect(this.buildSelectForAlias('children'))
      .leftJoinAndSelect('children.translations', 'childrenTranslations')
      .where('category.active = :active', { active: true })
      .andWhere('translations.slug = :slug', { slug })
      .andWhere('translations.locale = :locale', { locale })
      .andWhere('(parentTranslations.locale = :locale OR parentTranslations.locale IS NULL)', { locale })
      .andWhere('(childrenTranslations.locale = :locale OR childrenTranslations.locale IS NULL)', { locale })
      .getOneOrFail();
  }

  async findFeatured(locale: string = 'vi'): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select(this.baseSelect)
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoinAndSelect('category.posts', 'posts')
      .where('category.active = :active', { active: true })
      .andWhere('category.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('translations.locale = :locale', { locale })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findRootCategories(locale: string = 'vi'): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select(this.baseSelect)
      .leftJoinAndSelect('category.translations', 'translations')
      .leftJoin('category.children', 'children')
      .addSelect(this.buildSelectForAlias('children'))
      .leftJoinAndSelect('children.translations', 'childrenTranslations')
      .where('category.active = :active', { active: true })
      .andWhere('category.parentId IS NULL')
      .andWhere('translations.locale = :locale', { locale })
      .andWhere('(childrenTranslations.locale = :locale OR childrenTranslations.locale IS NULL)', { locale })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async findChildCategories(parentId: number, locale: string = 'vi'): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.active',
        'category.isFeatured',
        'category.type',
        'category.parentId',
        'category.createdAt',
        'category.updatedAt'
      ])
      .leftJoinAndSelect('category.translations', 'translations')
      .where('category.active = :active', { active: true })
      .andWhere('category.parentId = :parentId', { parentId })
      .andWhere('translations.locale = :locale', { locale })
      .orderBy('translations.name', 'ASC')
      .getMany();
  }

  async getCategoryTree(locale: string = 'vi'): Promise<Category[]> {
    const rootCategories = await this.findRootCategories(locale);
    
    // Recursively load children for each root category
    for (const rootCategory of rootCategories) {
      await this.loadChildrenRecursively(rootCategory, locale);
    }
    
    return rootCategories;
  }

  private async loadChildrenRecursively(category: Category, locale: string): Promise<void> {
    const children = await this.findChildCategories(category.id, locale);
    category.children = children;
    
    for (const child of children) {
      await this.loadChildrenRecursively(child, locale);
    }
  }

  // Helper method to get translation for a specific locale
  getTranslation(category: Category, locale: string = 'vi') {
    return category.translations?.find(t => t.locale === locale);
  }

  // Helper method to get slug for a specific locale
  getSlug(category: Category, locale: string = 'vi'): string | undefined {
    return this.getTranslation(category, locale)?.slug;
  }
} 
