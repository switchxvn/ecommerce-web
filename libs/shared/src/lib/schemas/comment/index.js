import { z } from 'zod';
import { CommentStatus } from '../../interfaces/comment.interface';
export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment content is required'),
    postId: z.number(),
    parentId: z.number().nullable().optional(),
    authorName: z.string().nullable().optional(),
    authorEmail: z.string().email('Invalid email format').nullable().optional(),
});
export const updateCommentSchema = z.object({
    id: z.number(),
    content: z.string().min(1, 'Comment content is required').optional(),
    status: z.nativeEnum(CommentStatus).optional(),
});
export const getCommentByIdSchema = z.number();
export const listCommentsSchema = z.object({
    postId: z.number().optional(),
    status: z.nativeEnum(CommentStatus).optional(),
    page: z.number().min(1).default(1).optional(),
    limit: z.number().min(1).max(100).default(10).optional(),
});
//# sourceMappingURL=index.js.map