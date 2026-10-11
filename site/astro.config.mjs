// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim();

export default defineConfig({
	...(publicSiteUrl ? { site: publicSiteUrl } : {}),
	vite: {
		build: {
			// 字体保持独立资源，即使分片很小也按实际字符下载，不塞进全站CSS。
			assetsInlineLimit: (filePath) => /\.woff2?$/.test(filePath) ? false : undefined,
		},
	},
});
