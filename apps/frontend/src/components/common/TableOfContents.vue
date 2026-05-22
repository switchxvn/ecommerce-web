<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from "vue";
import { useLocalization } from "~/composables/useLocalization";

const props = defineProps<{
  contentSelector: string; // CSS selector cho phần nội dung chứa các thẻ h2
  title?: string; // Tiêu đề cho phần danh mục
  offset?: number; // Offset khi scroll (mặc định là 80px)
  collapsible?: boolean; // Có cho phép thu gọn không
  defaultCollapsed?: boolean; // Trạng thái thu gọn mặc định
}>();

const { t } = useLocalization();
const tableOfContents = ref<{ id: string; text: string; level: number }[]>([]);
const isCollapsed = ref(props.defaultCollapsed || false);
const isInitialized = ref(false);

// Hàm toggle collapse
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// Hàm tạo ID từ text
const createIdFromText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Loại bỏ ký tự đặc biệt
    .replace(/\s+/g, "-") // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/--+/g, "-") // Loại bỏ nhiều dấu gạch ngang liên tiếp
    .trim();
};

// Hàm tạo danh mục từ nội dung
const generateTableOfContents = () => {
  if (typeof window === "undefined") return; // Kiểm tra nếu đang ở server-side

  // Đợi một chút để đảm bảo DOM đã được cập nhật
  setTimeout(() => {
    const contentElement = document.querySelector(props.contentSelector);
    if (!contentElement) {
      console.warn(`Element with selector "${props.contentSelector}" not found`);
      return;
    }

    // Tìm tất cả các thẻ h2 trong nội dung
    const headings = contentElement.querySelectorAll("h2");
    const toc: { id: string; text: string; level: number }[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent || `Mục ${index + 1}`;
      const id = heading.id || createIdFromText(text);

      // Nếu heading chưa có id, thêm id vào
      if (!heading.id) {
        heading.id = id;
      }

      toc.push({
        id,
        text,
        level: 2, // h2 có level là 2
      });
    });

    tableOfContents.value = toc;
    isInitialized.value = true;
  }, 100);
};

// Theo dõi thay đổi của nội dung và cập nhật danh mục
const observeContentChanges = () => {
  if (typeof window === "undefined") return;

  const contentElement = document.querySelector(props.contentSelector);
  if (!contentElement) return;

  const observer = new MutationObserver(() => {
    generateTableOfContents();
  });

  observer.observe(contentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
};

// Hàm xử lý sự kiện tab-changed
const handleTabChanged = () => {
  // Đợi DOM cập nhật xong
  nextTick(() => {
    // Đợi thêm một chút để đảm bảo transition đã hoàn thành
    setTimeout(() => {
      generateTableOfContents();
    }, 200);
  });
};

// Hàm scroll đến heading
const scrollToHeading = (id: string) => {
  if (typeof window === "undefined") return;

  const element = document.getElementById(id);
  if (!element) return;

  const offset = props.offset || 80; // Mặc định offset là 80px

  // Tính toán vị trí scroll
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  // Scroll đến vị trí với hiệu ứng mượt
  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });

  // Thêm hash vào URL nhưng không scroll lại
  history.pushState(null, "", `#${id}`);
};

// Hàm xử lý transition
const startTransition = (el: HTMLElement) => {
  el.style.height = "auto";
  const height = el.scrollHeight;
  el.style.height = "0px";
  // Trigger a reflow
  el.offsetHeight;
  el.style.height = `${height}px`;
};

const endTransition = (el: HTMLElement) => {
  el.style.height = "";
};

// Khởi tạo danh mục khi component được mount
onMounted(() => {
  // Đợi DOM cập nhật xong
  nextTick(() => {
    generateTableOfContents();
    const observer = observeContentChanges();

    // Kiểm tra nếu có hash trong URL, scroll đến heading tương ứng
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        scrollToHeading(id);
      }, 500); // Đợi 500ms để đảm bảo nội dung đã được render
    }

    // Lắng nghe sự kiện tab-changed
    if (typeof window !== "undefined") {
      window.addEventListener("tab-changed", handleTabChanged);
    }

    // Cleanup khi component bị hủy
    onBeforeUnmount(() => {
      if (observer) {
        observer.disconnect();
      }

      if (typeof window !== "undefined") {
        window.removeEventListener("tab-changed", handleTabChanged);
      }
    });
  });
});

// Theo dõi thay đổi của selector
watch(
  () => props.contentSelector,
  () => {
    generateTableOfContents();
  }
);

// Tự động cập nhật lại khi component được hiển thị
onMounted(() => {
  // Đợi một chút để đảm bảo DOM đã được cập nhật
  setTimeout(() => {
    generateTableOfContents();
  }, 300);
});
</script>

<template>
  <div v-if="tableOfContents.length > 0" class="table-of-contents">
    <div
      class="table-of-contents__header"
      :class="{ 'cursor-pointer': props.collapsible }"
      @click="props.collapsible ? toggleCollapse() : undefined"
    >
      <h3 class="table-of-contents__title">
        {{ title || t("products.tableOfContents") || "Nội dung chính" }}
      </h3>
      <button
        v-if="props.collapsible"
        class="table-of-contents__toggle"
        type="button"
        :aria-expanded="String(!isCollapsed)"
        :aria-label="isCollapsed ? 'Expand table of contents' : 'Collapse table of contents'"
        @click.stop="toggleCollapse()"
      >
        <span class="table-of-contents__toggle-icon" aria-hidden="true">
          <svg class="table-of-contents__toggle-list" viewBox="0 0 24 24" fill="none">
            <path d="M5 7h10" />
            <path d="M5 12h10" />
            <path d="M5 17h10" />
            <path d="M18 7h.01" />
            <path d="M18 12h.01" />
            <path d="M18 17h.01" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            :class="{ 'rotate-180': isCollapsed }"
            class="table-of-contents__toggle-chevron"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
      </button>
    </div>
    <transition
      name="collapse-transition"
      @enter="startTransition"
      @after-enter="endTransition"
      @before-leave="startTransition"
      @after-leave="endTransition"
    >
      <ol v-show="!isCollapsed" class="table-of-contents__list">
        <li
          v-for="(item, index) in tableOfContents"
          :key="index"
          class="table-of-contents__item"
          :class="`table-of-contents__item--level-${item.level}`"
        >
          <a
            :href="`#${item.id}`"
            class="table-of-contents__link"
            @click.prevent="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </a>
        </li>
      </ol>
    </transition>
  </div>
  <div v-else-if="isInitialized" class="table-of-contents table-of-contents--empty">
    <div class="table-of-contents__header">
      <h3 class="table-of-contents__title">
        {{ title || t("products.tableOfContents") || "Nội dung chính" }}
      </h3>
    </div>
    <p class="table-of-contents__empty-message">
      {{ t("products.noTableOfContents") || "Không tìm thấy mục nào trong nội dung" }}
    </p>
  </div>
</template>

<style scoped>
.table-of-contents {
  margin: 0 0 1.5rem 0;
  padding: 1.25rem 1.35rem 1.15rem;
  background-color: #fff;
  border: 1px solid rgba(24, 24, 27, 0.12);
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.dark .table-of-contents {
  background-color: #111827;
  border-color: rgba(255, 255, 255, 0.12);
}

.table-of-contents__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 4rem;
  cursor: pointer;
}

.table-of-contents__title {
  margin: 0;
  color: #111827;
  font-size: clamp(1.25rem, 1.1rem + 0.45vw, 1.6rem);
  line-height: 1.05;
  font-weight: 650;
}

.dark .table-of-contents__title {
  color: #f9fafb;
}

.table-of-contents__toggle {
  width: 4.5rem;
  height: 4rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  color: rgb(var(--primary-600));
  background: #fff;
  border: 1px solid rgba(24, 24, 27, 0.24);
  border-radius: 0.875rem;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.table-of-contents__toggle:hover {
  background: rgb(var(--primary-50));
  border-color: rgb(var(--primary-200));
  color: rgb(var(--primary-700));
}

.dark .table-of-contents__toggle {
  color: rgb(var(--primary-300));
  background: #111827;
  border-color: rgba(255, 255, 255, 0.2);
}

.dark .table-of-contents__toggle:hover {
  background: rgb(var(--primary-500) / 0.12);
  border-color: rgb(var(--primary-400) / 0.4);
  color: rgb(var(--primary-200));
}

.table-of-contents__toggle-icon {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.table-of-contents__toggle-list {
  width: 1.8rem;
  height: 1.8rem;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.table-of-contents__toggle-chevron {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.table-of-contents__list {
  margin: 0.7rem 0 0;
  padding-left: 1.55rem;
  overflow: hidden;
  transition: height 0.3s ease-in-out;
  list-style: decimal;
  font-size: clamp(1rem, 0.95rem + 0.28vw, 1.18rem);
  line-height: 1.55;
}

.collapse-transition-enter-active,
.collapse-transition-leave-active {
  transition: height 0.3s ease-in-out, opacity 0.3s ease;
  overflow: hidden;
}

.collapse-transition-enter-from,
.collapse-transition-leave-to {
  height: 0 !important;
  opacity: 0;
}

.table-of-contents__item {
  margin: 0 0 0.45rem;
  color: #111827;
}

.table-of-contents__item:last-child {
  margin-bottom: 0;
}

.table-of-contents__item--level-2 {
  padding-left: 0;
}

.table-of-contents__item--level-3 {
  padding-left: 1rem;
}

.table-of-contents__link {
  display: inline;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  font-size: 1em;
  line-height: inherit;
  transition: color 0.2s ease;
}

.table-of-contents__link:hover {
  color: rgb(var(--primary-600));
}

.dark .table-of-contents__item {
  color: #f3f4f6;
}

.dark .table-of-contents__link:hover {
  color: rgb(var(--primary-300));
}

.table-of-contents--empty {
  opacity: 0.88;
}

.table-of-contents__empty-message {
  margin: 1rem 0 0;
  color: #6b7280;
  font-size: 1rem;
}

.dark .table-of-contents__empty-message {
  color: #9ca3af;
}

@media (max-width: 640px) {
  .table-of-contents {
    padding: 1rem 1rem 0.95rem;
    border-radius: 0.875rem;
  }

  .table-of-contents__title {
    font-size: 1.2rem;
    line-height: 1.08;
  }

  .table-of-contents__toggle {
    width: 3.5rem;
    height: 3.25rem;
    border-radius: 0.75rem;
  }

  .table-of-contents__list {
    margin-top: 0.6rem;
    padding-left: 1.3rem;
    font-size: 1rem;
  }

  .table-of-contents__link {
    font-size: 1em;
  }
}
</style>
