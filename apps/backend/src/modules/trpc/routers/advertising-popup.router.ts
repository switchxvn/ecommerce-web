import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../procedures';
import type {
  PopupUpdateInput,
  PopupWriteInput,
} from '../../advertising-popup/admin/services/advertising-popup-admin.service';

const nonEmptyString = z.string().trim().min(1);

const isSafeCtaUrl = (value: string): boolean => {
  if (value.includes('\\')) return false;
  if (/^\/(?!\/)/.test(value)) return true;
  if (!/^https:\/\/[^/?#]/i.test(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
};

const ctaUrlSchema = nonEmptyString.refine(
  isSafeCtaUrl,
  'CTA URL must be an internal path or an absolute HTTPS URL',
);

const popupWritableFieldsSchema = z.object({
  name: nonEmptyString,
  title: nonEmptyString,
  content: nonEmptyString,
  ctaLabel: nonEmptyString,
  ctaUrl: ctaUrlSchema,
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
});

const validateSchedule = (
  value: { startsAt?: Date | null; endsAt?: Date | null },
  ctx: z.RefinementCtx,
) => {
  if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endsAt'],
      message: 'End date must be after start date',
    });
  }
};

export const popupWriteSchema = popupWritableFieldsSchema.superRefine(validateSchedule);
export const popupUpdateSchema = popupWritableFieldsSchema.partial().superRefine(validateSchedule);

function mapError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof NotFoundException) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Advertising popup not found' });
  }
  if (error instanceof BadRequestException || error instanceof z.ZodError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid advertising popup request' });
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unable to process advertising popup request',
  });
}

export const advertisingPopupRouter = router({
  getActive: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.frontend.advertisingPopup.findEligible();
    } catch (error) {
      return mapError(error);
    }
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.admin.advertisingPopup.findAll();
    } catch (error) {
      return mapError(error);
    }
  }),

  getById: protectedProcedure.input(z.number().int().positive()).query(async ({ input, ctx }) => {
    try {
      return await ctx.services.admin.advertisingPopup.findById(input);
    } catch (error) {
      return mapError(error);
    }
  }),

  create: protectedProcedure.input(popupWriteSchema).mutation(async ({ input, ctx }) => {
    try {
      return await ctx.services.admin.advertisingPopup.create({
        ...input,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
      } as PopupWriteInput);
    } catch (error) {
      return mapError(error);
    }
  }),

  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), data: popupUpdateSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.admin.advertisingPopup.update(
          input.id,
          input.data as PopupUpdateInput,
        );
      } catch (error) {
        return mapError(error);
      }
    }),

  setActive: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.admin.advertisingPopup.setActive(input.id, input.active);
      } catch (error) {
        return mapError(error);
      }
    }),

  delete: protectedProcedure.input(z.number().int().positive()).mutation(async ({ input, ctx }) => {
    try {
      await ctx.services.admin.advertisingPopup.delete(input);
      return { success: true };
    } catch (error) {
      return mapError(error);
    }
  }),
});
