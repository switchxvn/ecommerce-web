import { z } from 'zod';
// Base schema for tag
const tagBaseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    slug: z.string().min(1, 'Slug is required'),
    isActive: z.boolean().default(true),
    color: z.string().optional().nullable(),
    order: z.number().default(0),
});
// Schema for creating a new tag
export const createTagSchema = tagBaseSchema;
// Schema for updating an existing tag
export const updateTagSchema = z.object({
    id: z.number().int().positive(),
    ...tagBaseSchema.partial().shape
});
// Schema for getting a tag by ID
export const getTagByIdSchema = z.number().int().positive();
// Schema for getting a tag by slug
export const getTagBySlugSchema = z.string().min(1);
// Schema for getting tags with filters
export const getTagsSchema = z.object({
    isActive: z.boolean().optional(),
}).partial();
// Schema for deleting a tag
export const deleteTagSchema = z.number().int().positive();
//# sourceMappingURL=tag.schema.js.map