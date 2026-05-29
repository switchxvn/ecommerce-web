import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../procedures';
import { CreateSessionData } from '../../user-session/interfaces/user-session-services.interface';

// Định nghĩa router cho user-session
export const userSessionRouter = router({
  // Frontend routes - Public
  getSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.userSessionFrontendService.getSession(input.sessionId);
      } catch (error) {
        ctx.logger.error('Failed to get session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get session',
          cause: error,
        });
      }
    }),

  startSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      userId: z.number().optional().nullable(),
      ipAddress: z.string().optional(),
      country: z.string().optional(),
      userAgent: z.string().optional(),
      deviceInfo: z.record(z.any()).optional(),
      ttl: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const sessionData: CreateSessionData = {
          sessionId: input.sessionId,
          userId: input.userId,
          ipAddress: input.ipAddress,
          country: input.country,
          userAgent: input.userAgent,
          deviceInfo: input.deviceInfo,
          ttl: input.ttl,
        };
        return await ctx.services.userSessionFrontendService.startSession(sessionData);
      } catch (error) {
        ctx.logger.error('Failed to start session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start session',
          cause: error,
        });
      }
    }),

  updateSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      lastActivity: z.union([z.date(), z.string()]).optional(),
      isActive: z.boolean().optional(),
      expireAt: z.date().optional(),
      country: z.string().optional(),
      ipAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { sessionId, ...updateData } = input;
        // Chuyển đổi lastActivity từ string sang Date nếu cần
        const processedData = {
          ...updateData,
          lastActivity: updateData.lastActivity && typeof updateData.lastActivity === 'string'
            ? new Date(updateData.lastActivity)
            : updateData.lastActivity
        };
        
        const updatedSession = await ctx.services.userSessionFrontendService.updateSession(
          sessionId,
          processedData
        );
        
        if (!updatedSession) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }
        
        return updatedSession;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error('Failed to update session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update session',
          cause: error,
        });
      }
    }),

  refreshSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      ttl: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const refreshedSession = await ctx.services.userSessionFrontendService.refreshSession(
          input.sessionId,
          input.ttl
        );
        
        if (!refreshedSession) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }
        
        return refreshedSession;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error('Failed to refresh session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refresh session',
          cause: error,
        });
      }
    }),

  endSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const endedSession = await ctx.services.userSessionFrontendService.endSession(
          input.sessionId
        );
        
        if (!endedSession) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }
        
        return endedSession;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error('Failed to end session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to end session',
          cause: error,
        });
      }
    }),

  getActiveUserCount: publicProcedure
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.userSessionFrontendService.getActiveUserCount();
      } catch (error) {
        ctx.logger.error('Failed to get active user count:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get active user count',
          cause: error,
        });
      }
    }),
}); 
