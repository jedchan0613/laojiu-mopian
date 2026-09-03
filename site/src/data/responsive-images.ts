import imageManifest from './generated/image-manifest.json';

interface ImageVariant {
	src: string;
	width: number;
	height: number;
}

interface ImageManifestEntry {
	width: number;
	height: number;
	variants: ImageVariant[];
}

const manifest = imageManifest as Record<string, ImageManifestEntry>;

export interface ResponsiveImage {
	src: string;
	srcset?: string;
	width: number;
	height: number;
}

export const getResponsiveImage = (source: string): ResponsiveImage => {
	const entry = manifest[source];
	if (!entry) return { src: source, width: 1200, height: 800 };

	const fallback = [...entry.variants].reverse().find((variant) => variant.width <= 1280)
		?? entry.variants.at(-1);
	return {
		src: fallback?.src ?? source,
		srcset: entry.variants.length
			? entry.variants.map((variant) => `${variant.src} ${variant.width}w`).join(', ')
			: undefined,
		width: entry.width,
		height: entry.height,
	};
};
