import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { useSkeletonGate } from './useSkeletonGate';

describe('useSkeletonGate', () => {
  it('shows a skeleton on first client paint, then reveals content', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { shouldShowSkeleton } = useSkeletonGate();
        return { shouldShowSkeleton };
      },
      template: `
        <div>
          <div v-if="shouldShowSkeleton" data-testid="skeleton">skeleton</div>
          <div v-else data-testid="content">content</div>
        </div>
      `,
    });

    const wrapper = mount(TestComponent);

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);

    await nextTick();
    await nextTick();

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
  });
});
