'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import {
    SIZE_PRESET_OPTIONS,
    getPresetDimensions,
    getPresetTooltip,
    type SizePreset,
    type SizeRatio,
    type SizeTier
} from '@/lib/size-utils';
import { cn } from '@/lib/utils';
import { RectangleHorizontal, RectangleVertical, Square, SquareDashed } from 'lucide-react';
import type { GptImageModel } from '@/lib/cost-utils';

type SizePresetPickerProps = {
    value: SizePreset;
    onValueChange: (value: SizePreset) => void;
    disabled: boolean;
    model: GptImageModel;
    idPrefix: string;
    supportsCustomSize?: boolean;
};

function getTierLabel(tier: SizeTier, t: ReturnType<typeof useI18n>['t']) {
    switch (tier) {
        case '1k':
            return t('form.sizeTier1k');
        case '2k':
            return t('form.sizeTier2k');
        case '4k':
            return t('form.sizeTier4k');
    }
}

function getCostHint(tier: SizeTier, t: ReturnType<typeof useI18n>['t']) {
    switch (tier) {
        case '1k':
            return t('form.sizeCost1k');
        case '2k':
            return t('form.sizeCost2k');
        case '4k':
            return t('form.sizeCost4k');
    }
}

function getRatioLabel(ratio: SizeRatio, t: ReturnType<typeof useI18n>['t']) {
    switch (ratio) {
        case 'square':
            return t('form.sizeRatioSquare');
        case 'landscape':
            return t('form.sizeRatioLandscape');
        case 'portrait':
            return t('form.sizeRatioPortrait');
    }
}

const ratioIcon = {
    square: Square,
    landscape: RectangleHorizontal,
    portrait: RectangleVertical
};

const TIERS: SizeTier[] = ['1k', '2k', '4k'];
const RATIOS: SizeRatio[] = ['square', 'landscape', 'portrait'];
const DEFAULT_TIER: SizeTier = '2k';
const DEFAULT_RATIO: SizeRatio = 'square';
const CUSTOM_GROUP_VALUE = '__custom';

function getPresetValue(ratio: SizeRatio, tier: SizeTier): SizePreset {
    return `${ratio}_${tier}` as SizePreset;
}

function getSelection(value: SizePreset): { ratio: SizeRatio; tier: SizeTier; isCustom: boolean } {
    if (value === 'custom') {
        return { ratio: DEFAULT_RATIO, tier: DEFAULT_TIER, isCustom: true };
    }

    const option = SIZE_PRESET_OPTIONS.find((item) => item.value === value);
    if (option) {
        return { ratio: option.ratio, tier: option.tier, isCustom: false };
    }

    if (value === 'landscape' || value === 'portrait' || value === 'square') {
        return { ratio: value, tier: DEFAULT_TIER, isCustom: false };
    }

    return { ratio: DEFAULT_RATIO, tier: DEFAULT_TIER, isCustom: false };
}

export function SizePresetPicker({
    value,
    onValueChange,
    disabled,
    model,
    idPrefix,
    supportsCustomSize = true
}: SizePresetPickerProps) {
    const { t } = useI18n();
    const selection = getSelection(value);
    const presetValue = getPresetValue(selection.ratio, selection.tier);
    const isCustom = value === 'custom';
    const selectedDimensions = isCustom ? null : getPresetDimensions(value, model) ?? getPresetDimensions(presetValue, model);
    const summaryTitle = isCustom
        ? t('common.custom')
        : `${getTierLabel(selection.tier, t)} · ${getRatioLabel(selection.ratio, t)}`;
    const summaryDetail = isCustom
        ? t('form.sizeCustomDescription')
        : selectedDimensions?.replace('x', ' × ') ?? t('form.sizeCustomDescription');
    const summaryCost = isCustom ? t('form.sizeCostCustom') : getCostHint(selection.tier, t);

    function handleTierChange(nextTier: string) {
        onValueChange(getPresetValue(selection.ratio, nextTier as SizeTier));
    }

    function handleRatioChange(nextRatio: string) {
        onValueChange(getPresetValue(nextRatio as SizeRatio, selection.tier));
    }

    return (
        <div className='space-y-4'>
            <div>
                <Label className='block text-white'>{t('common.size')}</Label>
                <p className='mt-1 text-xs text-white/50'>{t('form.sizeDescription')}</p>
            </div>
            <fieldset className='space-y-2'>
                <legend className='text-xs font-medium text-white/60'>{t('form.sizeTierGroup')}</legend>
                <RadioGroup
                    value={isCustom ? CUSTOM_GROUP_VALUE : selection.tier}
                    onValueChange={handleTierChange}
                    disabled={disabled}
                    className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                    {TIERS.map((tier) => {
                        const optionId = `${idPrefix}-tier-${tier}`;
                        const selected = !isCustom && selection.tier === tier;
                        const isHighCost = tier === '4k';

                        return (
                            <Label
                                key={tier}
                                htmlFor={optionId}
                                className={cn(
                                    'jmyr-control flex min-h-[74px] cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-white/80 transition-colors hover:bg-white/5',
                                    selected && 'border-white/45 bg-white/10 text-white',
                                    disabled && 'cursor-not-allowed opacity-60'
                                )}>
                                <RadioGroupItem
                                    id={optionId}
                                    value={tier}
                                    className='mt-1 border-white/35 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                />
                                <span className='min-w-0 flex-1'>
                                    <span className='block text-sm font-medium text-white'>{getTierLabel(tier, t)}</span>
                                    <span className={cn('mt-1 block text-xs', isHighCost ? 'text-amber-300' : 'text-white/50')}>
                                        {getCostHint(tier, t)}
                                    </span>
                                </span>
                            </Label>
                        );
                    })}
                </RadioGroup>
            </fieldset>
            <fieldset className='space-y-2'>
                <legend className='text-xs font-medium text-white/60'>{t('form.sizeRatioGroup')}</legend>
                <RadioGroup
                    value={isCustom ? CUSTOM_GROUP_VALUE : selection.ratio}
                    onValueChange={handleRatioChange}
                    disabled={disabled}
                    className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                    {RATIOS.map((ratio) => {
                        const Icon = ratioIcon[ratio];
                        const optionId = `${idPrefix}-ratio-${ratio}`;
                        const selected = !isCustom && selection.ratio === ratio;
                        const optionValue = getPresetValue(ratio, selection.tier);

                        return (
                            <Label
                                key={ratio}
                                htmlFor={optionId}
                                title={getPresetTooltip(optionValue, model) ?? undefined}
                                className={cn(
                                    'jmyr-control flex min-h-[74px] cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-white/80 transition-colors hover:bg-white/5',
                                    selected && 'border-white/45 bg-white/10 text-white',
                                    disabled && 'cursor-not-allowed opacity-60'
                                )}>
                                <RadioGroupItem
                                    id={optionId}
                                    value={ratio}
                                    className='mt-1 border-white/35 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                                />
                                <Icon className='mt-1 h-4 w-4 shrink-0 text-white/55' />
                                <span className='min-w-0 flex-1'>
                                    <span className='block text-sm font-medium text-white'>{getRatioLabel(ratio, t)}</span>
                                    <span className='mt-1 block text-xs text-white/50'>
                                        {getPresetDimensions(optionValue, model)?.replace('x', ' × ')}
                                    </span>
                                </span>
                            </Label>
                        );
                    })}
                </RadioGroup>
            </fieldset>
            <div className='jmyr-control rounded-md px-3 py-2 text-sm text-white/80'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-xs text-white/50'>{t('form.sizeSummaryLabel')}</span>
                    <span className={cn('text-xs', selection.tier === '4k' || isCustom ? 'text-amber-300' : 'text-white/50')}>
                        {summaryCost}
                    </span>
                </div>
                <div className='mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1'>
                    <span className='font-medium text-white'>{summaryTitle}</span>
                    <span className='text-xs text-white/55'>{summaryDetail}</span>
                </div>
            </div>
            {supportsCustomSize && (
                <button
                    type='button'
                    disabled={disabled}
                    aria-pressed={isCustom}
                    onClick={() => onValueChange(isCustom ? presetValue : 'custom')}
                    className={cn(
                        'jmyr-control flex min-h-[58px] w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left text-white/80 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60',
                        isCustom && 'border-amber-300/45 bg-amber-300/10 text-white'
                    )}>
                    <SquareDashed className='mt-1 h-4 w-4 shrink-0 text-white/55' />
                    <span className='min-w-0 flex-1'>
                        <span className='block text-sm font-medium text-white'>
                            {isCustom ? t('form.sizeCustomSelected') : t('form.sizeCustomAction')}
                        </span>
                        <span className='mt-0.5 block text-xs text-white/50'>{t('form.sizeCustomDescription')}</span>
                    </span>
                </button>
            )}
        </div>
    );
}
