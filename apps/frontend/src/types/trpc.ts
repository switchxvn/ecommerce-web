import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@backend/modules/trpc/routers';

export type { AppRouter };
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
