import type { GptImageModel } from '@/lib/cost-utils';

export type SizeValidation = { valid: true } | { valid: false; reason: string };

export const GPT_IMAGE_2_MIN_PIXELS = 655_360;
export const GPT_IMAGE_2_MAX_PIXELS = 8_294_400;
export const GPT_IMAGE_2_MAX_EDGE = 3840;
export const GPT_IMAGE_2_EDGE_MULTIPLE = 16;
export const GPT_IMAGE_2_MAX_ASPECT = 3;

export function validateGptImage2Size(width: number, height: number): SizeValidation {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return { valid: false, reason: 'Width and height must be positive numbers.' };
    }
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
        return { valid: false, reason: 'Width and height must be whole numbers.' };
    }
    if (width % GPT_IMAGE_2_EDGE_MULTIPLE !== 0 || height % GPT_IMAGE_2_EDGE_MULTIPLE !== 0) {
        return { valid: false, reason: `Both edges must be multiples of ${GPT_IMAGE_2_EDGE_MULTIPLE}.` };
    }
    if (width > GPT_IMAGE_2_MAX_EDGE || height > GPT_IMAGE_2_MAX_EDGE) {
        return { valid: false, reason: `Maximum edge is ${GPT_IMAGE_2_MAX_EDGE}px.` };
    }
    const long = Math.max(width, height);
    const short = Math.min(width, height);
    if (long / short > GPT_IMAGE_2_MAX_ASPECT) {
        return { valid: false, reason: `Aspect ratio (long:short) must be ≤ ${GPT_IMAGE_2_MAX_ASPECT}:1.` };
    }
    const pixels = width * height;
    if (pixels < GPT_IMAGE_2_MIN_PIXELS) {
        return { valid: false, reason: `Total pixels must be at least ${GPT_IMAGE_2_MIN_PIXELS.toLocaleString()}.` };
    }
    if (pixels > GPT_IMAGE_2_MAX_PIXELS) {
        return {
            valid: false,
            reason: `Total pixels must be no more than ${GPT_IMAGE_2_MAX_PIXELS.toLocaleString()}.`
        };
    }
    return { valid: true };
}

export type SizeTier = '1k' | '2k' | '4k';
export type SizeRatio = 'square' | 'landscape' | 'portrait';
export type SizePreset =
    | 'auto'
    | 'custom'
    | 'square'
    | 'landscape'
    | 'portrait'
    | `${SizeRatio}_${SizeTier}`;

export type SizePresetOption = {
    value: Exclude<SizePreset, 'auto' | 'custom' | 'square' | 'landscape' | 'portrait'>;
    tier: SizeTier;
    ratio: SizeRatio;
    dimensions: string;
};

export const SIZE_PRESET_OPTIONS: SizePresetOption[] = [
    { value: 'square_1k', tier: '1k', ratio: 'square', dimensions: '1024x1024' },
    { value: 'landscape_1k', tier: '1k', ratio: 'landscape', dimensions: '1536x1024' },
    { value: 'portrait_1k', tier: '1k', ratio: 'portrait', dimensions: '1024x1536' },
    { value: 'square_2k', tier: '2k', ratio: 'square', dimensions: '2048x2048' },
    { value: 'landscape_2k', tier: '2k', ratio: 'landscape', dimensions: '2560x1440' },
    { value: 'portrait_2k', tier: '2k', ratio: 'portrait', dimensions: '1440x2560' },
    { value: 'square_4k', tier: '4k', ratio: 'square', dimensions: '2880x2880' },
    { value: 'landscape_4k', tier: '4k', ratio: 'landscape', dimensions: '3840x2160' },
    { value: 'portrait_4k', tier: '4k', ratio: 'portrait', dimensions: '2160x3840' }
];

/**
 * Returns the concrete WxH string for a preset, tailored to the model.
 * Returns null for 'auto' (let the API pick) and 'custom' (caller provides WxH).
 * gpt-image-2 uses higher-resolution variants of the same ratios.
 */
export function getPresetDimensions(preset: SizePreset, model: GptImageModel): string | null {
    if (preset === 'auto' || preset === 'custom') return null;
    const option = SIZE_PRESET_OPTIONS.find((item) => item.value === preset);
    if (option) return option.dimensions;

    const isGptImage2 = model === 'gpt-image-2';
    switch (preset) {
        case 'square':
            return isGptImage2 ? '2048x2048' : '1024x1024';
        case 'landscape':
            return isGptImage2 ? '2560x1440' : '1536x1024';
        case 'portrait':
            return isGptImage2 ? '1440x2560' : '1024x1536';
    }

    return null;
}

/**
 * Human-readable dimension info for tooltips.
 */
export function getPresetTooltip(preset: SizePreset, model: GptImageModel): string | null {
    const dims = getPresetDimensions(preset, model);
    if (!dims) return null;
    const [w, h] = dims.split('x').map(Number);
    const mp = ((w * h) / 1_000_000).toFixed(1);
    const option = SIZE_PRESET_OPTIONS.find((item) => item.value === preset);
    const ratioPreset = option?.ratio ?? preset;
    const ratio = ratioPreset === 'square' ? '1:1' : ratioPreset === 'landscape' ? '16:9' : '9:16';
    return `${w} × ${h} · ${ratio} · ${mp} MP`;
}
