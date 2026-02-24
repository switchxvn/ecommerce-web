import type { z } from 'zod';
import {
  createFooterSchema,
  updateFooterSchema,
} from '../schemas/footer/footer.schema';

export { createFooterSchema, updateFooterSchema } from '../schemas/footer/footer.schema';
export type CreateFooterInput = z.infer<typeof createFooterSchema>;
export type UpdateFooterInput = z.infer<typeof updateFooterSchema>;
