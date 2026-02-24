import { useCartStore } from '~/stores/cart';

/**
 * Cart composable - provides access to cart store
 */
export function useCart() {
  const cartStore = useCartStore();
  
  return {
    // State (reactive from store)
    cart: cartStore.cart,
    cartItems: cartStore.cartItems,
    cartSummary: cartStore.cartSummary,
    cartItemCount: cartStore.cartItemCount,
    cartTotal: cartStore.cartTotal,
    cartSubtotal: cartStore.cartSubtotal,
    cartDiscount: cartStore.cartDiscount,
    isLoading: cartStore.isLoading,
    error: cartStore.error,
    isCartEnabled: cartStore.isCartEnabled,
    isInitialized: cartStore.isInitialized,

    // Actions
    initialize: cartStore.initialize,
    fetchCart: cartStore.fetchCartData,
    addToCart: cartStore.addToCart,
    updateCartItem: cartStore.updateCartItem,
    removeFromCart: cartStore.removeFromCart,
    clearCart: cartStore.clearCart,
    mergeGuestCart: cartStore.mergeGuestCart,
    
    // Legacy support
    items: cartStore.cartItems,
    totalItems: cartStore.cartItemCount,
    totalPrice: cartStore.cartTotal,
    getTotal: () => cartStore.cartTotal,
    getItemCount: () => cartStore.cartItemCount,
    updateQuantity: cartStore.updateCartItem
  };
}
