import PhotoSwipe from 'photoswipe';
import 'photoswipe/dist/photoswipe.css';
const props = defineProps();
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};
// Function to get image dimensions
const getImageDimensions = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            resolve({ width: 800, height: 600 }); // Default fallback size
        };
        img.src = url;
    });
};
// Initialize PhotoSwipe
const openPhotoSwipe = async () => {
    const dimensions = await getImageDimensions(props.imageUrl);
    const options = {
        dataSource: [{
                src: props.imageUrl,
                w: dimensions.width,
                h: dimensions.height,
                alt: props.name
            }],
        pswpModule: PhotoSwipe,
        showHideAnimationType: 'fade',
        showAnimationDuration: 300,
        hideAnimationDuration: 300,
        closeOnVerticalDrag: true,
        allowPanToNext: true,
        allowMouseDrag: true,
        maxZoomLevel: 3,
        scaleMode: 'fit'
    };
    const lightbox = new PhotoSwipe(options);
    lightbox.init();
};
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['food-menu-border']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "food-menu-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "food-menu-border" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (__VLS_ctx.openPhotoSwipe) },
    href: "#",
});
const __VLS_0 = {}.NuxtImg;
/** @type {[typeof __VLS_components.NuxtImg, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    src: (__VLS_ctx.imageUrl),
    alt: (__VLS_ctx.name),
    ...{ class: "food-menu-image" },
}));
const __VLS_2 = __VLS_1({
    src: (__VLS_ctx.imageUrl),
    alt: (__VLS_ctx.name),
    ...{ class: "food-menu-image" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "food-menu-title" },
});
(__VLS_ctx.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "food-menu-price" },
});
(__VLS_ctx.formatPrice(__VLS_ctx.price));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp" },
    tabindex: "-1",
    role: "dialog",
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__bg" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__scroll-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__ui pswp__ui--hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__top-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__counter" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "pswp__button pswp__button--close" },
    title: "Close (Esc)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "pswp__button pswp__button--share" },
    title: "Share",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "pswp__button pswp__button--fs" },
    title: "Toggle fullscreen",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "pswp__button pswp__button--zoom" },
    title: "Zoom in/out",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__preloader" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__preloader__icn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__preloader__cut" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__preloader__donut" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__share-modal pswp__share-modal--hidden pswp__single-tap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__share-tooltip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "pswp__button pswp__button--arrow--left" },
    title: "Previous (arrow left)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "pswp__button pswp__button--arrow--right" },
    title: "Next (arrow right)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__caption" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pswp__caption__center" },
});
/** @type {__VLS_StyleScopedClasses['food-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['food-menu-border']} */ ;
/** @type {__VLS_StyleScopedClasses['food-menu-image']} */ ;
/** @type {__VLS_StyleScopedClasses['food-menu-title']} */ ;
/** @type {__VLS_StyleScopedClasses['food-menu-price']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__bg']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__scroll-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__container']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__item']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__item']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__item']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__ui']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__ui--hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__top-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__counter']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button--close']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button--share']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button--fs']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button--zoom']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__preloader']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__preloader__icn']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__preloader__cut']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__preloader__donut']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__share-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__share-modal--hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__single-tap']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__share-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button--arrow--left']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__button--arrow--right']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__caption']} */ ;
/** @type {__VLS_StyleScopedClasses['pswp__caption__center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formatPrice: formatPrice,
            openPhotoSwipe: openPhotoSwipe,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=FoodMenuItem.vue.js.map
