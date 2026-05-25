'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import {
    SIZE_PRESET_OPTIONS,
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

export function SizePresetPicker({
    value,
    onValueChange,
    disabled,
    model,
    idPrefix,
    supportsCustomSize = true
}: SizePresetPickerProps) {
    const { t } = useI18n();

    return (
        <div className='space-y-3'>
            <div>
                <Label className='block text-white'>{t('common.size')}</Label>
                <p className='mt-1 text-xs text-white/50'>{t('form.sizeDescription')}</p>
            </div>
            <RadioGroup
                value={value}
                onValueChange={(nextValue) => onValueChange(nextValue as SizePreset)}
                disabled={disabled}
                className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {SIZE_PRESET_OPTIONS.map((option) => {
                    const Icon = ratioIcon[option.ratio];
                    const optionId = `${idPrefix}-${option.value}`;
                    const isHighCost = option.tier === '4k';

                    return (
                        <Label
                            key={option.value}
                            htmlFor={optionId}
                            title={getPresetTooltip(option.value, model) ?? undefined}
                            className={cn(
                                'jmyr-control flex min-h-[62px] cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-white/80 transition-colors hover:bg-white/5',
                                disabled && 'cursor-not-allowed opacity-60'
                            )}>
                            <RadioGroupItem
                                id={optionId}
                                value={option.value}
                                className='mt-1 border-white/35 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                            />
                            <Icon className='mt-1 h-4 w-4 shrink-0 text-white/55' />
                            <span className='min-w-0 flex-1'>
                                <span className='block truncate text-sm font-medium text-white'>
                                    {getTierLabel(option.tier, t)} · {getRatioLabel(option.ratio, t)}
                                </span>
                                <span className='mt-0.5 block text-xs text-white/50'>
                                    {option.dimensions.replace('x', ' × ')}
                                </span>
                                <span className={cn('mt-1 block text-[11px]', isHighCost ? 'text-amber-300' : 'text-white/40')}>
                                    {getCostHint(option.tier, t)}
                                </span>
                            </span>
                        </Label>
                    );
                })}
                {supportsCustomSize && (
                    <Label
                        htmlFor={`${idPrefix}-custom`}
                        className={cn(
                            'jmyr-control flex min-h-[62px] cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-white/80 transition-colors hover:bg-white/5',
                            disabled && 'cursor-not-allowed opacity-60'
                        )}>
                        <RadioGroupItem
                            id={`${idPrefix}-custom`}
                            value='custom'
                            className='mt-1 border-white/35 text-white data-[state=checked]:border-white data-[state=checked]:text-white'
                        />
                        <SquareDashed className='mt-1 h-4 w-4 shrink-0 text-white/55' />
                        <span className='min-w-0 flex-1'>
                            <span className='block truncate text-sm font-medium text-white'>{t('common.custom')}</span>
                            <span className='mt-0.5 block text-xs text-white/50'>{t('form.sizeCustomDescription')}</span>
                            <span className='mt-1 block text-[11px] text-amber-300'>{t('form.sizeCostCustom')}</span>
                        </span>
                    </Label>
                )}
            </RadioGroup>
        </div>
    );
}
