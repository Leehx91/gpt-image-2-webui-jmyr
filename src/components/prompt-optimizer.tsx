'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Check, Copy, Loader2, WandSparkles } from 'lucide-react';
import * as React from 'react';

export type PromptOptimizationMode = 'generate' | 'edit';

type PromptOptimizerProps = {
    mode: PromptOptimizationMode;
    prompt: string;
    disabled: boolean;
    onOptimize: (prompt: string, mode: PromptOptimizationMode) => Promise<string>;
    onUsePrompt: (prompt: string) => void;
};

export function PromptOptimizer({ mode, prompt, disabled, onOptimize, onUsePrompt }: PromptOptimizerProps) {
    const { t } = useI18n();
    const [optimizedPrompt, setOptimizedPrompt] = React.useState('');
    const [sourcePrompt, setSourcePrompt] = React.useState('');
    const [error, setError] = React.useState('');
    const [isOptimizing, setIsOptimizing] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [applied, setApplied] = React.useState(false);

    const trimmedPrompt = prompt.trim();
    const hasStaleResult = Boolean(optimizedPrompt && sourcePrompt && sourcePrompt !== trimmedPrompt);

    React.useEffect(() => {
        if (!trimmedPrompt) {
            setOptimizedPrompt('');
            setSourcePrompt('');
            setError('');
            setCopied(false);
            setApplied(false);
        }
    }, [trimmedPrompt]);

    const handleOptimize = async () => {
        if (!trimmedPrompt || isOptimizing) return;

        setIsOptimizing(true);
        setError('');
        setCopied(false);
        setApplied(false);

        try {
            const nextPrompt = await onOptimize(trimmedPrompt, mode);
            setOptimizedPrompt(nextPrompt);
            setSourcePrompt(trimmedPrompt);
        } catch (optimizeError) {
            setError(optimizeError instanceof Error ? optimizeError.message : t('promptOptimizer.failed'));
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleUsePrompt = () => {
        if (!optimizedPrompt) return;
        onUsePrompt(optimizedPrompt);
        setSourcePrompt(optimizedPrompt.trim());
        setApplied(true);
    };

    const handleCopy = async () => {
        if (!optimizedPrompt) return;
        try {
            await navigator.clipboard.writeText(optimizedPrompt);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className='space-y-2'>
            <div className='flex flex-col gap-2 rounded-md border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-xs leading-relaxed text-white/55'>
                    {mode === 'edit' ? t('promptOptimizer.editHint') : t('promptOptimizer.generateHint')}
                </p>
                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleOptimize}
                    disabled={disabled || isOptimizing || !trimmedPrompt}
                    className='jmyr-control shrink-0 border-white/15 px-3 text-white/85 hover:bg-white/10 hover:text-white'>
                    {isOptimizing ? <Loader2 className='h-4 w-4 animate-spin' /> : <WandSparkles className='h-4 w-4' />}
                    {isOptimizing ? t('promptOptimizer.optimizing') : t('promptOptimizer.optimize')}
                </Button>
            </div>

            {error && <p className='rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200'>{error}</p>}

            {optimizedPrompt && (
                <div className='jmyr-control rounded-md p-3'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div>
                            <p className='text-sm font-medium text-white'>{t('promptOptimizer.resultTitle')}</p>
                            {hasStaleResult && <p className='mt-0.5 text-xs text-amber-300'>{t('promptOptimizer.stale')}</p>}
                            {applied && <p className='mt-0.5 text-xs text-green-300'>{t('promptOptimizer.applied')}</p>}
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleCopy}
                                className='border-white/20 text-white/80 hover:bg-white/10 hover:text-white'>
                                {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                                {copied ? t('common.copied') : t('common.copy')}
                            </Button>
                            <Button
                                type='button'
                                variant='default'
                                size='sm'
                                onClick={handleUsePrompt}
                                className='bg-white text-black hover:bg-white/90'>
                                {t('promptOptimizer.use')}
                            </Button>
                        </div>
                    </div>
                    <p className='mt-3 whitespace-pre-wrap rounded-md border border-white/10 bg-black/15 p-3 text-sm leading-relaxed text-white/75'>
                        {optimizedPrompt}
                    </p>
                </div>
            )}
        </div>
    );
}
