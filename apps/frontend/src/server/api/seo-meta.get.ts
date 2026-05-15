import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@backend/modules/trpc/routers'
import { fetchTrpcQuery } from '../utils/trpc'

type RouterOutput = inferRouterOutputs<AppRouter>
type SeoOutput = RouterOutput['seo']['getSeoByPath']

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const path = query.path as string

    if (!path) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Path parameter is required'
      })
    }

    const seoData = await fetchTrpcQuery<SeoOutput | null>(event, 'seo.getSeoByPath', path)

    return {
      success: true,
      data: seoData || null
    }

  } catch (error) {
    console.error('[SEO API] Error fetching SEO data:', error)
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}) 
