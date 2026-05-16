import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@backend/modules/trpc/routers'
import { fetchTrpcQuery } from '../utils/trpc'
import {
  getSeoApiCooldownMs,
  markSeoApiFailure,
  markSeoApiSuccess,
  shouldBypassSeoApiFetch,
  shouldLogSeoApiFailure,
} from '../utils/seo-api-guard'

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

    if (shouldBypassSeoApiFetch()) {
      return {
        success: false,
        data: null,
        error: 'SEO API temporarily unavailable'
      }
    }

    const seoData = await fetchTrpcQuery<SeoOutput | null>(event, 'seo.getSeoByPath', path)
    markSeoApiSuccess()

    return {
      success: true,
      data: seoData || null
    }

  } catch (error) {
    if (isSeoUpstreamUnavailable(error)) {
      markSeoApiFailure()

      if (shouldLogSeoApiFailure()) {
        console.warn('[SEO API] Upstream unavailable; using fallback SEO data.', {
          error: error instanceof Error ? error.message : 'Unknown error',
          cooldownMs: getSeoApiCooldownMs(),
        })
      }
    } else {
      console.error('[SEO API] Error fetching SEO data:', error)
    }
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}) 

function isSeoUpstreamUnavailable(error: unknown): boolean {
  const code = (error as { cause?: { code?: string } })?.cause?.code
  const message = error instanceof Error ? error.message : ''

  return code === 'ECONNREFUSED' || message.includes('fetch failed')
}
