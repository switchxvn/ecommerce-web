import { z } from 'zod';
// Schema cho việc lấy setting theo key
export const getSettingByKeySchema = z.string();
// Schema cho việc lấy settings theo group
export const getSettingsByGroupSchema = z.string();
// Schema cho việc tạo setting mới
export const createSettingSchema = z.object({
    key: z.string(),
    value: z.string(),
    group: z.string().optional(),
    description: z.string().optional(),
    is_public: z.boolean().default(false),
});
// Schema cho việc cập nhật setting
export const updateSettingSchema = z.object({
    value: z.string(),
    group: z.string().optional(),
    description: z.string().optional(),
    is_public: z.boolean().optional(),
});
// Schema cho việc xóa setting
export const deleteSettingSchema = z.number();
//# sourceMappingURL=settings.schema.js.map