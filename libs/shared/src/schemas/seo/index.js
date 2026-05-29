import { z } from 'zod';
export const createSeoSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    keywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    robotsTxt: z.string().optional(),
    locale: z.string().min(2, 'Locale is required'),
    isActive: z.boolean().optional().default(true)
});
export const updateSeoSchema = createSeoSchema.partial();
//# sourceMappingURL=index.js.map