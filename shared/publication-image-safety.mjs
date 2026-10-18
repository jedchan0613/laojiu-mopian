// 在任何原生图片解码之前检查字节。签名筛选不代替后续解码完整性检查。
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
const configuredDecoders = new WeakSet();

export function detectPublicationImageMime(bytes) {
	if (!(bytes instanceof Uint8Array)) return '';
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
	if (bytes.length >= 8 && pngSignature.every((byte, index) => bytes[index] === byte)) return 'image/png';
	if (bytes.length >= 12 && [0x52, 0x49, 0x46, 0x46].every((byte, index) => bytes[index] === byte)
		&& [0x57, 0x45, 0x42, 0x50].every((byte, index) => bytes[index + 8] === byte)) return 'image/webp';
	return '';
}

export function assertPublicationImageSignature(bytes, { filename, mimeType = '' }) {
	const actual = detectPublicationImageMime(bytes);
	const extension = /\.([^.]+)$/.exec(String(filename))?.[1].toLowerCase();
	const expected = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[extension];
	// 未声明类型或通用二进制类型不能作为证明，只能由真实字节与扩展名共同决定。
	const declared = String(mimeType).trim().toLowerCase();
	if (!actual || actual !== expected || (declared && declared !== 'application/octet-stream' && declared !== actual)) {
		throw new Error(`图片实际格式与文件说明不一致：${filename}`);
	}
	return { mimeType: actual, format: formats[actual] };
}

export function configurePublicationImageDecoder(sharp) {
	if (configuredDecoders.has(sharp)) return;
	// 按解码器父类阻止文件、缓冲区等全部入口；不影响 JPEG/PNG/WebP 或合成测试图片。
	sharp.block({ operation: ['VipsForeignLoadHeif', 'VipsForeignLoadSvg', 'VipsForeignLoadTiff', 'VipsForeignLoadPdf', 'VipsForeignLoadGif'] });
	configuredDecoders.add(sharp);
}

export function createPublicationImageInput(sharp, bytes, { filename, mimeType, limitInputPixels = 40_000_000 }) {
	assertPublicationImageSignature(bytes, { filename, mimeType });
	configurePublicationImageDecoder(sharp);
	return sharp(bytes, { limitInputPixels, failOn: 'warning', animated: false });
}
