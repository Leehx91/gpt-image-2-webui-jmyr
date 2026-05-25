'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { Images, Sparkles } from 'lucide-react';

type ModeToggleProps = {
    currentMode: 'generate' | 'edit';
    onModeChange: (mode: 'generate' | 'edit') => void;
};

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
    const { t } = useI18n();

    return (
        <Tabs
            value={currentMode}
            onValueChange={(value) => onModeChange(value as 'generate' | 'edit')}
            className='w-full sm:w-auto'>
            <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-md border border-white/10 bg-white/[0.035] p-1 sm:w-auto'>
                <TabsTrigger
                    value='generate'
                    className={`gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                        currentMode === 'generate'
                            ? 'border-white bg-white text-black'
                            : 'border-transparent bg-transparent text-white/60 hover:border-white/20 hover:bg-white/5 hover:text-white/85'
                    } `}>
                    <Sparkles className='h-4 w-4' />
                    {t('mode.generate')}
                </TabsTrigger>
                <TabsTrigger
                    value='edit'
                    className={`gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                        currentMode === 'edit'
                            ? 'border-white bg-white text-black'
                            : 'border-transparent bg-transparent text-white/60 hover:border-white/20 hover:bg-white/5 hover:text-white/85'
                    } `}>
                    <Images className='h-4 w-4' />
                    {t('mode.edit')}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
