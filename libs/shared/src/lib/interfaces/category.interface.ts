import { Post } from './post.interface';
import { Product } from './product.interface';
import { CategoryType } from '../../types/category.type';

export interface CategoryTranslation {
  id: number;
  name: string;
  description?: string;
  locale: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  active: boolean;
  isFeatured: boolean;
  type: CategoryType;
  icon?: string | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  parentId: number | null;
  parent: Category | null;
  children: Category[];
  translations: CategoryTranslation[];
  posts?: Post[];
  products?: Product[];
  createdAt: Date;
  updatedAt: Date;
} 
