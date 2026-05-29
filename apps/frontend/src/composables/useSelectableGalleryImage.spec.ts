import { ref } from 'vue';
import { describe, expect, it } from 'vitest';

import { useSelectableGalleryImage } from './useSelectableGalleryImage';

describe('useSelectableGalleryImage', () => {
  it('uses the product thumbnail as the initial main image', () => {
    const thumbnail = ref('/images/products/main.jpg');
    const { activeImage } = useSelectableGalleryImage(thumbnail);

    expect(activeImage.value).toBe('/images/products/main.jpg');
  });

  it('switches the main image when a gallery thumbnail is selected', () => {
    const thumbnail = ref('/images/products/main.jpg');
    const { activeImage, selectImage } = useSelectableGalleryImage(thumbnail);

    selectImage('/images/products/gallery-1.jpg');

    expect(activeImage.value).toBe('/images/products/gallery-1.jpg');
  });

  it('resets to the latest product thumbnail when the product changes', () => {
    const thumbnail = ref('/images/products/main.jpg');
    const { activeImage, selectImage } = useSelectableGalleryImage(thumbnail);

    selectImage('/images/products/gallery-1.jpg');
    thumbnail.value = '/images/products/next-main.jpg';

    expect(activeImage.value).toBe('/images/products/next-main.jpg');
  });

  it('ignores empty image selections', () => {
    const thumbnail = ref('/images/products/main.jpg');
    const { activeImage, selectImage } = useSelectableGalleryImage(thumbnail);

    selectImage('');

    expect(activeImage.value).toBe('/images/products/main.jpg');
  });
});
