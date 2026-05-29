import { z } from 'zod';
export const menuItemTranslationSchema = z.object({
    locale: z.string().min(2, 'Locale is required'),
    label: z.string().min(1, 'Label is required')
});
// Base schema for menu item
const menuItemBaseSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    href: z.string().min(1, 'Href is required'),
    icon: z.string().optional().nullable(),
    order: z.number().default(0),
    isActive: z.boolean().default(true),
    parentId: z.number().nullable().optional(),
    translations: z.array(menuItemTranslationSchema).min(1, 'At least one translation is required')
});
// Schema for creating a new menu item
export const createMenuItemSchema = z.object({
    parentId: z.number().nullable().optional(),
    isActive: z.boolean().optional().default(true),
    order: z.number().optional(),
    label: z.string().optional(),
    href: z.string().optional(),
    icon: z.string().optional(),
    translations: z.array(menuItemTranslationSchema).min(1, 'At least one translation is required')
});
// Schema for updating an existing menu item
export const updateMenuItemSchema = z.object({
    id: z.number(),
    data: createMenuItemSchema.partial()
});
export const updateMenuItemOrderSchema = z.object({
    id: z.number(),
    order: z.number(),
    parentId: z.number().nullable()
});
// Schema for getting a menu item by ID
export const getMenuItemByIdSchema = z.number().int().positive();
// Schema for getting menu items with filters
export const getMenuItemsSchema = z.object({
    parentId: z.number().optional(),
    isActive: z.boolean().optional(),
}).partial();
// Schema for deleting a menu item
export const deleteMenuItemSchema = z.number().int().positive();
//# sourceMappingURL=menu-item.schema.js.map