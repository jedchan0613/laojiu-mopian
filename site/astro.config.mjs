// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim();

export default defineConfig({
	...(publicSiteUrl ? { site: publicSiteUrl } : {}),
});
