import { useTrpc } from './useTrpc';
import { ref, computed } from 'vue';
import { useLocalization } from './useLocalization';
import type { Category as BackendCategory, CategoryTranslation } from '@ew/shared';
import { CategoryType } from '@ew/shared';
import { normalizeLocaleCode } from '../utils/locale';


// Định nghĩa kiểu dữ liệu Category
export type Category = BackendCategory;

/**
 * Composable để quản lý và truy xuất dữ liệu danh mục
 * @returns Các phương thức và dữ liệu liên quan đến danh mục
 */
export function useCategory() {
  const trpc = useTrpc();
  const { locale } = useLocalization();
  const getSafeLocale = () => normalizeLocaleCode(locale.value, 'vi');
  
  // State
  const categories = ref<Category[]>([]);
  const productCategories = ref<Category[]>([]);
  const featuredCategories = ref<Category[]>([]);
  const popularCategories = ref<Category[]>([]);
  const hotCategories = ref<Category[]>([]);
  const categoryTree = ref<Category[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  /**
   * Lấy tất cả danh mục
   */
  const fetchAllCategories = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.all.query({ locale: getSafeLocale() });
      categories.value = result as Category[];
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      error.value = err.message || 'Có lỗi xảy ra khi tải danh mục';
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy danh mục theo ID
   * @param id ID của danh mục
   */
  const fetchCategoryById = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.byId.query({ id, locale: getSafeLocale() });
      return result as Category;
    } catch (err: any) {
      console.error(`Error fetching category by ID ${id}:`, err);
      error.value = err.message || 'Có lỗi xảy ra khi tải chi tiết danh mục';
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy danh mục theo slug
   * @param slug Slug của danh mục
   */
  const fetchCategoryBySlug = async (slug: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.bySlug.query({ slug, locale: getSafeLocale() });
      return result as Category;
    } catch (err: any) {
      console.error(`Error fetching category by slug ${slug}:`, err);
      error.value = err.message || 'Có lỗi xảy ra khi tải chi tiết danh mục';
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy danh mục nổi bật
   */
  const fetchFeaturedCategories = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.featured.query({ locale: getSafeLocale() });
      featuredCategories.value = result as Category[];
    } catch (err: any) {
      console.error('Error fetching featured categories:', err);
      error.value = err.message || 'Có lỗi xảy ra khi tải danh mục nổi bật';
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy danh mục phổ biến
   */
  const fetchPopularCategories = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.popular.query({ locale: getSafeLocale() });
      popularCategories.value = result as Category[];
    } catch (err: any) {
      console.error('Error fetching popular categories:', err);
      error.value = err.message || 'Có lỗi xảy ra khi tải danh mục phổ biến';
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy danh mục hot
   */
  const fetchHotCategories = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.hot.query({ locale: getSafeLocale() });
      hotCategories.value = result as Category[];
    } catch (err: any) {
      console.error('Error fetching hot categories:', err);
      error.value = err.message || 'Có lỗi xảy ra khi tải danh mục hot';
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy cây danh mục
   */
  const fetchCategoryTree = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.tree.query({ locale: getSafeLocale() });
      categoryTree.value = result as Category[];
    } catch (err: any) {
      console.error('Error fetching category tree:', err);
      error.value = err.message || 'Có lỗi xảy ra khi tải cây danh mục';
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Lấy danh sách danh mục gốc (không có parent)
   */
  const rootCategories = computed(() => {
    return categories.value.filter(cat => !cat.parentId);
  });
  
  /**
   * Lấy danh sách danh mục con của một danh mục
   * @param parentId ID của danh mục cha
   */
  const getChildCategories = (parentId: number) => {
    return categories.value.filter(cat => cat.parentId === parentId);
  };
  
  /**
   * Lấy danh mục theo loại (product, news, both)
   * @param type Loại danh mục cần lấy
   */
  const fetchCategoriesByType = async (type: CategoryType) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.byType.query({ type, locale: getSafeLocale() });
      
      if (type === CategoryType.PRODUCT) {
        productCategories.value = result as Category[];
      }
      
      return result as Category[];
    } catch (err: any) {
      console.error(`Error fetching categories by type ${type}:`, err);
      error.value = err.message || 'Có lỗi xảy ra khi tải danh mục theo loại';
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Helper function to get category translation
  const getCategoryTranslation = (category: Category): CategoryTranslation | null => {
    if (!category.translations || category.translations.length === 0) {
      return null;
    }
    return category.translations.find(t => t.locale === locale.value) || category.translations[0];
  };

  // Computed để lọc và gộp các danh mục trùng tên
  const uniqueCategories = computed(() => {
    if (!productCategories.value || productCategories.value.length === 0) {
      return [];
    }
    
    // Tạo map để gộp các danh mục theo slug
    const categoryMap = new Map<string, Category>();
    
    productCategories.value.forEach(category => {
      const translation = getCategoryTranslation(category);
      if (!translation) return;
      
      const existingCategory = categoryMap.get(translation.slug);
      
      if (existingCategory) {
        // Nếu danh mục đã tồn tại, gộp số lượng sản phẩm
        const combinedProducts = [...(existingCategory.products || []), ...(category.products || [])];
        categoryMap.set(translation.slug, {
          ...category,
          products: combinedProducts
        });
      } else {
        categoryMap.set(translation.slug, category);
      }
    });
    
    // Chuyển map thành mảng và sắp xếp theo tên
    return Array.from(categoryMap.values())
      .sort((a, b) => {
        const aTranslation = getCategoryTranslation(a);
        const bTranslation = getCategoryTranslation(b);
        return (aTranslation?.name || '').localeCompare(bTranslation?.name || '');
      });
  });

  /**
   * Lấy tất cả danh mục sản phẩm
   */
  const fetchProductCategories = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await trpc.category.byType.query({ 
        type: CategoryType.PRODUCT, 
        locale: locale.value 
      });
      
      productCategories.value = result as unknown as Category[];
      return result as unknown as Category[];
    } catch (err: any) {
      console.error('Error fetching product categories:', err);
      error.value = err.message || 'Có lỗi xảy ra khi tải danh mục sản phẩm';
      return [];
    } finally {
      loading.value = false;
    }
  };
  
  return {
    // State
    categories,
    productCategories,
    featuredCategories,
    popularCategories,
    hotCategories,
    categoryTree,
    loading,
    error,
    
    // Computed
    rootCategories,
    uniqueCategories,
    
    // Methods
    fetchAllCategories,
    fetchCategoryById,
    fetchCategoryBySlug,
    fetchFeaturedCategories,
    fetchPopularCategories,
    fetchHotCategories,
    fetchCategoryTree,
    fetchCategoriesByType,
    fetchProductCategories,
    getChildCategories,
    getCategoryTranslation
  };
} 
