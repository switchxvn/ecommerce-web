import { ref, computed, h } from 'vue'
import { useToast } from './useToast'
import { useRouter } from 'vue-router'
import { useTrpc } from './useTrpc'
import slugify from 'slugify'
import { createEmptyCategoryTranslation, normalizeCategoryTranslation, withSeoFallbacks } from '../utils/categoryTranslation'

const CategoryType = {
  NEWS: 'news',
  PRODUCT: 'product',
  BOTH: 'both',
  GALLERY: 'gallery'
} as const

type CategoryTypeValue = typeof CategoryType[keyof typeof CategoryType]

interface Translation {
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  canonicalUrl: string
}

interface CategoryTranslation {
  locale: string
  name: string
  slug: string
  description: string | undefined
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
}

interface CategoryForm {
  name: string
  type: CategoryTypeValue
  active: boolean
  icon?: string
  priceRangeMin: number | null
  priceRangeMax: number | null
  translations: Record<string, Translation>
}

interface ValidationErrors {
  name?: string
  slug?: string
  type?: string
  icon?: string
  priceRangeMax?: string
}

interface CategoryFilter {
  page: number
  limit: number
  search: string
  active: boolean | null
  type?: CategoryTypeValue
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  locale?: string
}

export function useCategory() {
  const router = useRouter()
  const toast = useToast()
  const trpc = useTrpc()

  // Shared state
  const loading = ref(false)
  const saveAndContinue = ref(false)
  const form = ref<CategoryForm>({
    name: '',
    type: CategoryType.NEWS,
    active: true,
    icon: '',
    priceRangeMin: null,
    priceRangeMax: null,
    translations: {}
  })
  const errors = ref<ValidationErrors>({})
  const selectedLanguage = ref('')
  
  // List state
  const categories = ref<any[]>([])
  const totalItems = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const filter = ref<CategoryFilter>({
    page: 1,
    limit: 10,
    search: '',
    active: null
  })

  // Computed property for current translation
  const currentTranslation = computed(() => {
    if (!selectedLanguage.value || !form.value.translations[selectedLanguage.value]) {
      return {
        ...createEmptyCategoryTranslation(),
      }
    }
    return form.value.translations[selectedLanguage.value]
  })

  // Thay đổi cách render icon để tránh lỗi
  const safeIconRenderer = (iconName: string | undefined) => {
    if (!iconName) return null;
    
    // Trả về text thay vì component
    return () => h('div', { class: 'inline-flex items-center' }, [
      h('span', { class: 'text-sm' }, iconName)
    ]);
  };

  // Thay đổi cách hiển thị icon để tránh lỗi
  const iconDisplay = computed(() => {
    return safeIconRenderer(form.value.icon);
  });

  const resetForm = () => {
    form.value = {
      name: '',
      type: CategoryType.NEWS,
      active: true,
      icon: '',
      priceRangeMin: null,
      priceRangeMax: null,
      translations: {}
    }
    errors.value = {}
  }

  const generateSlug = () => {
    if (form.value.name) {
      if (!form.value.translations[selectedLanguage.value]) {
        form.value.translations[selectedLanguage.value] = createEmptyCategoryTranslation()
      }
      form.value.translations[selectedLanguage.value].slug = slugify(form.value.name, {
        lower: true,
        strict: true,
        locale: selectedLanguage.value,
        trim: true
      })
    }
  }

  const validateForm = (): boolean => {
    errors.value = {}
    let isValid = true

    // Validate name
    if (!form.value.name?.trim()) {
      errors.value.name = 'Name is required'
      isValid = false
    }

    // Validate slug
    if (!currentTranslation.value.slug?.trim()) {
      errors.value.slug = 'Slug is required'
      isValid = false
    }

    // Validate type
    if (!form.value.type) {
      errors.value.type = 'Type is required'
      isValid = false
    }

    if (
      form.value.priceRangeMin !== null &&
      form.value.priceRangeMax !== null &&
      form.value.priceRangeMin > form.value.priceRangeMax
    ) {
      errors.value.priceRangeMax = 'Giá đến phải lớn hơn hoặc bằng giá từ'
      isValid = false
    }

    return isValid
  }

  // CRUD Operations
  const fetchCategories = async (filterParams?: Partial<CategoryFilter>) => {
    try {
      loading.value = true
      
      if (filterParams) {
        filter.value = { ...filter.value, ...filterParams }
      }
      
      const result = await trpc.admin.category.getAllCategories.query({
        page: filter.value.page,
        limit: filter.value.limit,
        search: filter.value.search,
        active: filter.value.active,
        type: filter.value.type,
        sortBy: filter.value.sortBy,
        sortOrder: filter.value.sortOrder,
        locale: filter.value.locale
      })
      
      categories.value = result.categories
      totalItems.value = result.total
      totalPages.value = result.totalPages
      currentPage.value = result.currentPage
      itemsPerPage.value = result.limit
    } catch (error: any) {
      console.error('Failed to fetch categories:', error)
      
      let errorMessage = 'Failed to fetch categories'
      if (error.message) {
        errorMessage += `: ${error.message}`
      }
      
      toast.error(errorMessage, 8000)
    } finally {
      loading.value = false
    }
  }

  const fetchCategory = async (id: number) => {
    try {
      loading.value = true
      const category = await trpc.admin.category.getCategoryById.query(id)
      
      if (category) {
        // Initialize translations
        const translations: Record<string, any> = {}
        
        category.translations?.forEach((translation: any) => {
          translations[translation.locale] = normalizeCategoryTranslation(translation)
        })

        form.value = {
          name: category.translations?.find((t: any) => t.locale === selectedLanguage.value)?.name || '',
          type: category.type as CategoryTypeValue,
          active: category.active,
          icon: category.icon || '',
          priceRangeMin: category.priceRangeMin ?? null,
          priceRangeMax: category.priceRangeMax ?? null,
          translations
        }
      }
    } catch (error) {
      console.error('Failed to fetch category:', error)
      router.push('/categories')
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (continueEditing = false) => {
    try {
      // Validate form before submitting
      if (!validateForm()) {
        toast.error('Please check all required fields', 8000)
        return
      }

      loading.value = true
      saveAndContinue.value = continueEditing

      if (selectedLanguage.value) {
        // Save current content to translations before submitting
        form.value.translations[selectedLanguage.value] = {
          name: form.value.name,
          slug: currentTranslation.value.slug,
          description: currentTranslation.value.description,
          metaTitle: currentTranslation.value.metaTitle,
          metaDescription: currentTranslation.value.metaDescription,
          metaKeywords: currentTranslation.value.metaKeywords,
          ogTitle: currentTranslation.value.ogTitle,
          ogDescription: currentTranslation.value.ogDescription,
          ogImage: currentTranslation.value.ogImage,
          canonicalUrl: currentTranslation.value.canonicalUrl
        }
      }

      // Prepare minimal data for create that matches server schema
      const createData = {
        name: form.value.name,
        slug: currentTranslation.value.slug,
        type: form.value.type,
        active: form.value.active,
        icon: form.value.icon,
        priceRangeMin: form.value.type === CategoryType.PRODUCT || form.value.type === CategoryType.BOTH ? form.value.priceRangeMin : null,
        priceRangeMax: form.value.type === CategoryType.PRODUCT || form.value.type === CategoryType.BOTH ? form.value.priceRangeMax : null,
        translations: Object.entries(form.value.translations).map(([locale, content]) => {
          const seoContent = withSeoFallbacks(content)
          return {
            locale,
            name: seoContent.name,
            slug: seoContent.slug,
            description: seoContent.description || undefined,
            metaTitle: seoContent.metaTitle || undefined,
            metaDescription: seoContent.metaDescription || undefined,
            metaKeywords: seoContent.metaKeywords || undefined,
            ogTitle: seoContent.ogTitle || undefined,
            ogDescription: seoContent.ogDescription || undefined,
            ogImage: seoContent.ogImage || undefined,
            canonicalUrl: seoContent.canonicalUrl || undefined
          }
        })
      }

      const result = await trpc.admin.category.createCategory.mutate(createData)
      
      toast.success(`Category "${form.value.name}" created successfully!`, 8000)
      
      if (!continueEditing) {
        router.push('/categories')
      } else {
        // Reset form for new category
        resetForm()
      }
      
      return result
    } catch (error: any) {
      console.error('Error creating category:', error)
      
      let errorMessage = ''
      
      if (error.cause) {
        errorMessage += error.cause
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Failed to create category. Please try again.'
      }
      
      toast.error(errorMessage, 8000)
    } finally {
      loading.value = false
      saveAndContinue.value = false
    }
  }

  const updateCategory = async (id: number, continueEditing = false) => {
    try {
      // Validate form before submitting
      if (!validateForm()) {
        toast.error('Please check all required fields', 8000)
        return
      }

      loading.value = true
      saveAndContinue.value = continueEditing

      if (selectedLanguage.value) {
        // Save current content to translations
        form.value.translations[selectedLanguage.value] = {
          name: form.value.name,
          slug: currentTranslation.value.slug,
          description: currentTranslation.value.description,
          metaTitle: currentTranslation.value.metaTitle,
          metaDescription: currentTranslation.value.metaDescription,
          metaKeywords: currentTranslation.value.metaKeywords,
          ogTitle: currentTranslation.value.ogTitle,
          ogDescription: currentTranslation.value.ogDescription,
          ogImage: currentTranslation.value.ogImage,
          canonicalUrl: currentTranslation.value.canonicalUrl
        }
      }

      // Prepare update data với định dạng đúng: { id, data: { ... } }
      const updateData = {
        id,
        data: {
          type: form.value.type,
          active: form.value.active,
          icon: form.value.icon,
          priceRangeMin: form.value.type === CategoryType.PRODUCT || form.value.type === CategoryType.BOTH ? form.value.priceRangeMin : null,
          priceRangeMax: form.value.type === CategoryType.PRODUCT || form.value.type === CategoryType.BOTH ? form.value.priceRangeMax : null,
          translations: Object.entries(form.value.translations).map(([locale, content]) => {
            const seoContent = withSeoFallbacks(content)
            return {
              locale,
              name: seoContent.name,
              slug: seoContent.slug,
              description: seoContent.description || undefined,
              metaTitle: seoContent.metaTitle || undefined,
              metaDescription: seoContent.metaDescription || undefined,
              metaKeywords: seoContent.metaKeywords || undefined,
              ogTitle: seoContent.ogTitle || undefined,
              ogDescription: seoContent.ogDescription || undefined,
              ogImage: seoContent.ogImage || undefined,
              canonicalUrl: seoContent.canonicalUrl || undefined
            }
          })
        }
      }

      await trpc.admin.category.updateCategory.mutate(updateData)
      
      toast.success(`Category "${form.value.name}" updated successfully!`, 8000)
      
      if (!continueEditing) {
        router.push('/categories')
      } else {
        // Refresh the category data
        await fetchCategory(id)
      }
    } catch (error: any) {
      console.error('Error updating category:', error)
      
      let errorMessage = ''
      
      if (error.cause) {
        errorMessage += error.cause
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Failed to update category. Please try again.'
      }
      
      toast.error(errorMessage, 8000)
    } finally {
      loading.value = false
      saveAndContinue.value = false
    }
  }

  const toggleActive = async (id: number, active: boolean) => {
    try {
      loading.value = true
      
      // Prepare minimal data for update
      const updateData = {
        active: active
      }

      await trpc.admin.category.updateCategory.mutate({
        id: id,
        data: updateData
      })
      
      toast.success(`Category ${active ? 'activated' : 'deactivated'} successfully!`, 8000)
      
      // Refresh the list
      await fetchCategories()
    } catch (error: any) {
      console.error('Error toggling category status:', error)
      
      let errorMessage = `Failed to ${active ? 'activate' : 'deactivate'} category`
      
      if (error.cause) {
        errorMessage += `: ${error.cause}`
      } else if (error.message) {
        errorMessage += `: ${error.message}`
      }
      
      toast.error(errorMessage, 8000)
    } finally {
      loading.value = false
    }
  }

  const bulkAction = async (action: string, ids: number[]) => {
    try {
      loading.value = true
      
      if (action === 'delete') {
        for (const id of ids) {
          await trpc.admin.category.deleteCategory.mutate(id)
        }
        toast.success(`${ids.length} categories deleted successfully!`, 8000)
      } else if (action === 'activate' || action === 'deactivate') {
        const isActive = action === 'activate'
        
        for (const id of ids) {
          await trpc.admin.category.updateCategory.mutate({
            id,
            data: { active: isActive }
          })
        }
        
        toast.success(`${ids.length} categories ${isActive ? 'activated' : 'deactivated'} successfully!`, 8000)
      }
      
      // Refresh the list
      await fetchCategories()
    } catch (error: any) {
      console.error(`Error performing bulk action "${action}":`, error)
      
      let errorMessage = `Failed to perform ${action} action`
      
      if (error.cause) {
        errorMessage += `: ${error.cause}`
      } else if (error.message) {
        errorMessage += `: ${error.message}`
      }
      
      toast.error(errorMessage, 8000)
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      loading.value = true
      await trpc.admin.category.deleteCategory.mutate(id)
      toast.success('Category deleted successfully!', 8000)
      
      // Refresh the list
      await fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      
      let errorMessage = 'Failed to delete category'
      
      if (error.cause) {
        errorMessage += `: ${error.cause}`
      } else if (error.message) {
        errorMessage += `: ${error.message}`
      }
      
      toast.error(errorMessage, 8000)
    } finally {
      loading.value = false
    }
  }

  const applyFilter = async () => {
    await fetchCategories()
  }

  const resetFilter = () => {
    filter.value = {
      page: 1,
      limit: 10,
      search: '',
      active: null
    }
    fetchCategories()
  }

  const changePage = async (page: number) => {
    filter.value.page = page
    await fetchCategories()
  }

  const fetchNewsCategoriesByLocale = async (locale = 'en') => {
    try {
      loading.value = true
      const result = await trpc.admin.category.getAllCategories.query({
        page: 1,
        limit: 100,
        type: CategoryType.NEWS,
        locale
      })
      
      return result.categories
    } catch (error: any) {
      console.error('Failed to fetch news categories:', error)
      
      let errorMessage = 'Failed to fetch news categories'
      if (error.message) {
        errorMessage += `: ${error.message}`
      }
      
      toast.error(errorMessage, 8000)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    // Constants
    CategoryType,
    
    // State
    loading,
    form,
    errors,
    currentTranslation,
    selectedLanguage,
    saveAndContinue,
    categories,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    filter,
    iconDisplay,
    
    // Methods
    resetForm,
    generateSlug,
    validateForm,
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    bulkAction,
    applyFilter,
    resetFilter,
    changePage,
    safeIconRenderer,
    fetchNewsCategoriesByLocale
  }
} 
