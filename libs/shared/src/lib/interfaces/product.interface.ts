import { ProductType } from '../types/product.type';
import { PriceRequest } from './price-request.interface';
import { Category } from './category.interface';

export interface ProductTranslation {
  id: number;
  title: string;
  content?: string;
  shortDescription?: string;
  locale: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSpecification {
  id: number;
  name: string;
  value: string;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCombo {
  id: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  type: ProductType;
  title: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  formattedPrice?: string;
  shortDescription: string;
  content: string;
  thumbnail: string;
  gallery: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  videoTitle: string;
  videoUrl: string;
  videoThumbnail: string;
  videoReview?: string;
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  stock?: number;
  active: boolean;
  categories: Category[];
  translations: ProductTranslation[];
  specifications?: ProductSpecification[];
  combos?: ProductCombo[];
  crossSellProducts?: Product[];
  sidebarItems?: {
    id?: number;
    itemType: 'post' | 'service';
    itemId: number;
    position: number;
  }[];
  priceRequests: PriceRequest[];
  variants?: {
    id: number;
    sku: string;
    price: number | null;
    comparePrice: number | null;
    formattedPrice: string;
    stock: number;
    attributeValues: {
      [attributeId: number]: number;
    };
  }[];
  variantAttributes?: {
    attributes: {
      id: number;
      name: string;
      displayName: string;
      values: {
        id: number;
        value: string;
        displayValue: string;
        thumbnail?: string;
      }[];
      required: boolean;
    }[];
    variants: {
      id: number;
      sku: string;
      price: number | null;
      comparePrice: number | null;
      formattedPrice: string;
      stock: number;
      attributeValues: {
        [attributeId: number]: number;
      };
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
} 
