import { z } from 'zod';
export const postTranslationSchema = z.object({
    locale: z.string().min(2, 'Locale is required'),
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    content: z.string().min(1, 'Content is required'),
    shortDescription: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    ogImage: z.string().nullable().optional()
});
const postBaseSchema = {
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    status: z.enum(['draft', 'published']),
    thumbnail: z.string().nullable().optional(),
    shortDescription: z.string().nullable().optional(),
    translations: z.array(postTranslationSchema).min(1, 'At least one translation is required'),
    tags: z.array(z.string()).optional(),
    categoryIds: z.array(z.number()).optional(),
};
export const createPostSchema = z.object(postBaseSchema);
export const updatePostSchema = z.object({
    id: z.number(),
    data: z.object(postBaseSchema).partial()
});
export const getPostByIdSchema = z.number();
//# sourceMappingURL=index.js.map