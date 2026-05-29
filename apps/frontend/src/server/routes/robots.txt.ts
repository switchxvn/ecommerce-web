import { defineEventHandler, setHeader } from 'h3';
import { useRuntimeConfig } from '#imports';
import { buildRobotsTxt } from '../../utils/seo';

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const content = buildRobotsTxt(config.public.siteUrl);

  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return content;
});
