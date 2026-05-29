import { z } from 'zod';
// Base schema for logo
const logoBaseSchema = z.object({
    url: z.string().min(1, 'URL is required'),
    alt: z.string().optional().nullable(),
    type: z.string().default('main'),
    isActive: z.boolean().default(true),
    width: z.number().optional().nullable(),
    height: z.number().optional().nullable(),
});
// Schema for creating a new logo
export const createLogoSchema = logoBaseSchema;
// Schema for updating an existing logo
export const updateLogoSchema = z.object({
    id: z.number().int().positive(),
    ...logoBaseSchema.partial().shape
});
// Schema for getting a logo by ID
export const getLogoByIdSchema = z.number().int().positive();
// Schema for getting logos with filters
export const getLogosSchema = z.object({
    type: z.string().optional(),
    isActive: z.boolean().optional(),
}).partial();
// Schema for deleting a logo
export const deleteLogoSchema = z.number().int().positive();
//# sourceMappingURL=logo.schema.js.map