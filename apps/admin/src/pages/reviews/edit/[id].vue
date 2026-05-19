<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../../../composables/useAuth";
import { useTrpc } from "../../../composables/useTrpc";
import { useRouter, useRoute } from "vue-router";
import { StarIcon } from "lucide-vue-next";
import Swal from "sweetalert2";
import PageHeader from "../../../components/common/header/PageHeader.vue";
import { ReviewStatus } from "@ew/shared";

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {};
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: "Edit Review - Admin Panel",
});

const router = useRouter();
const route = useRoute();
const reviewId = Number(route.params.id);
const { checkAuth } = useAuth();
const trpc = useTrpc();

// Form state
const isLoading = ref(false);
const isLoadingReview = ref(true);
const error = ref<string | null>(null);
const locale = ref("vi");
const authorName = ref("");
const authorAvatar = ref("");
const profession = ref("");
const rating = ref(5);
const title = ref("");
const content = ref("");
const serviceTypeId = ref<number | null>(null);
const productId = ref<number | null>(null);
const visitDate = ref("");
const featured = ref(false);
const status = ref<ReviewStatus>(ReviewStatus.ACTIVE);

// Service types for dropdown
const serviceTypes = ref<
  { id: number; name: string; slug: string; translations: any[] }[]
>([]);
const isLoadingServiceTypes = ref(true);
const products = ref<
  { id: number; sku?: string | null; translations?: { title?: string }[] }[]
>([]);
const isLoadingProducts = ref(true);

// Get review by ID
async function fetchReview() {
  try {
    isLoadingReview.value = true;
    error.value = null;

    const review = await trpc.admin.review.getById.query({
      id: reviewId,
      locale: locale.value,
    });

    // Fill form fields with review data
    authorName.value = review.authorName;
    authorAvatar.value = review.authorAvatar || "";
    profession.value = review.profession || "";
    rating.value = review.rating;
    serviceTypeId.value = review.serviceTypeId || null;
    productId.value = review.productId || null;
    visitDate.value = review.visitDate ? new Date(review.visitDate).toISOString().split("T")[0] : "";
    featured.value = review.featured;
    status.value = review.status;

    // Get the translation for current locale or first translation
    const translation = review.translations.find(
      (t) => t.locale === locale.value
    ) || review.translations[0];

    if (translation) {
      title.value = translation.title || "";
      content.value = translation.content;
      locale.value = translation.locale;
    }

  } catch (err: any) {
    error.value = err.message || "Failed to load review";
    console.error("Error loading review:", err);
  } finally {
    isLoadingReview.value = false;
  }
}

// Get all service types
async function fetchServiceTypes() {
  try {
    isLoadingServiceTypes.value = true;
    // Use the appropriate service type endpoint
    const response = await trpc.admin.review.getServiceTypes.query();
    serviceTypes.value = response;
  } catch (err: any) {
    console.error("Error loading service types:", err);
  } finally {
    isLoadingServiceTypes.value = false;
  }
}

async function fetchProducts() {
  try {
    isLoadingProducts.value = true;
    const response = await trpc.admin.products.getAllProducts.query({
      page: 1,
      limit: 1000,
      published: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    products.value = response.products || [];
  } catch (err: any) {
    console.error("Error loading products:", err);
  } finally {
    isLoadingProducts.value = false;
  }
}

// Watch for locale changes to reload the content
watch(locale, async () => {
  await fetchReview();
});

// Submit the form
async function submitForm() {
  try {
    if (!authorName.value) {
      error.value = "Author name is required";
      return;
    }

    if (!content.value) {
      error.value = "Review content is required";
      return;
    }

    isLoading.value = true;
    error.value = null;

    const translations = [
      {
        locale: locale.value,
        title: title.value,
        content: content.value,
      },
    ];

    const result = await trpc.admin.review.update.mutate({
      id: reviewId,
      data: {
        authorName: authorName.value,
        authorAvatar: authorAvatar.value || null,
        profession: profession.value || null,
        rating: rating.value,
        serviceTypeId: serviceTypeId.value || null,
        productId: productId.value || null,
        visitDate: visitDate.value || null,
        featured: featured.value,
        status: status.value,
        translations,
      },
    });

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Review updated successfully",
      timer: 1500,
      showConfirmButton: false,
    });

    // Refresh the review data
    await fetchReview();
  } catch (err: any) {
    error.value = err.message || "Failed to update review";
    console.error("Error updating review:", err);
  } finally {
    isLoading.value = false;
  }
}

// Delete review
async function deleteReview() {
  // Ask for confirmation
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      await trpc.admin.review.delete.mutate({ id: reviewId });
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Review has been deleted",
        timer: 1500,
        showConfirmButton: false,
      });
      // Redirect to reviews list
      router.push("/reviews");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete review",
      });
    }
  }
}

// Cancel and go back
function cancel() {
  router.push("/reviews");
}

// Load data on mounted
onMounted(async () => {
  await checkAuth();
  await Promise.all([fetchReview(), fetchServiceTypes(), fetchProducts()]);
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <PageHeader
      title="Edit Review"
      description="Update an existing customer review or testimonial"
      :backButton="{
        label: 'Back to Reviews',
        onClick: cancel,
      }"
    />

    <!-- Error Message -->
    <div
      v-if="error"
      class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
    >
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingReview" class="mt-8 flex justify-center">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-indigo-600">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading review data...
      </div>
    </div>

    <div v-else class="bg-white shadow-sm rounded-lg p-6 mt-6">
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Author Information -->
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
            Author Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="authorName"
                class="block text-sm font-medium text-gray-700"
              >
                Author Name <span class="text-red-500">*</span>
              </label>
              <input
                id="authorName"
                v-model="authorName"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label
                for="profession"
                class="block text-sm font-medium text-gray-700"
              >
                Profession
              </label>
              <input
                id="profession"
                v-model="profession"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                for="authorAvatar"
                class="block text-sm font-medium text-gray-700"
              >
                Avatar URL
              </label>
              <input
                id="authorAvatar"
                v-model="authorAvatar"
                type="url"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://example.com/avatar.jpg"
              />
              <p class="mt-1 text-sm text-gray-500">
                Enter a direct URL to the author's avatar image
              </p>
            </div>
            <div>
              <label
                for="visitDate"
                class="block text-sm font-medium text-gray-700"
              >
                Visit Date
              </label>
              <input
                id="visitDate"
                v-model="visitDate"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Review Content -->
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
            Review Content
          </h3>
          <div class="space-y-6">
            <div>
              <label
                for="locale"
                class="block text-sm font-medium text-gray-700"
              >
                Language <span class="text-red-500">*</span>
              </label>
              <select
                id="locale"
                v-model="locale"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label
                for="title"
                class="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                id="title"
                v-model="title"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                for="content"
                class="block text-sm font-medium text-gray-700"
              >
                Content <span class="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                v-model="content"
                rows="5"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Review Metadata -->
        <div>
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
            Review Details
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="serviceType"
                class="block text-sm font-medium text-gray-700"
              >
                Service Type
              </label>
              <select
                id="serviceType"
                v-model="serviceTypeId"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                :disabled="isLoadingServiceTypes"
              >
                <option :value="null">Select a service type</option>
                <option
                  v-for="type in serviceTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.name || type.slug }}
                </option>
              </select>
              <div
                v-if="isLoadingServiceTypes"
                class="mt-1 text-sm text-gray-500"
              >
                Loading service types...
              </div>
            </div>
            <div>
              <label
                for="product"
                class="block text-sm font-medium text-gray-700"
              >
                Product
              </label>
              <select
                id="product"
                v-model="productId"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                :disabled="isLoadingProducts"
              >
                <option :value="null">Select a product</option>
                <option
                  v-for="product in products"
                  :key="product.id"
                  :value="product.id"
                >
                  {{ product.translations?.[0]?.title || product.sku || `Product #${product.id}` }}
                </option>
              </select>
              <div
                v-if="isLoadingProducts"
                class="mt-1 text-sm text-gray-500"
              >
                Loading products...
              </div>
            </div>
            <div>
              <label
                for="rating"
                class="block text-sm font-medium text-gray-700"
              >
                Rating <span class="text-red-500">*</span>
              </label>
              <div class="mt-2 flex items-center">
                <div class="flex space-x-1">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    @click="rating = star"
                    class="focus:outline-none"
                  >
                    <StarIcon
                      class="w-7 h-7"
                      :class="
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      "
                    />
                  </button>
                </div>
                <span class="ml-3 text-gray-700">{{ rating }} / 5</span>
              </div>
            </div>
            <div>
              <label
                for="status"
                class="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                v-model="status"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div class="flex items-center mt-6">
              <input
                id="featured"
                v-model="featured"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label for="featured" class="ml-2 block text-sm text-gray-700">
                Mark as Featured Review
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between pt-4">
          <button
            type="button"
            @click="deleteReview"
            class="px-4 py-2 border border-red-300 text-red-700 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            :disabled="isLoading"
          >
            Delete Review
          </button>
          
          <div class="flex space-x-3">
            <button
              type="button"
              @click="cancel"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="isLoading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="isLoading"
            >
              <span v-if="isLoading">Saving...</span>
              <span v-else>Update Review</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template> 
