'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { Check, Copy, Loader2, WandSparkles } from 'lucide-react';
import * as React from 'react';

export type PromptOptimizationMode = 'generate' | 'edit';
export type PromptOptimizationRequest = {
    mode: PromptOptimizationMode;
    prompt: string;
    iterateInstruction?: string;
};

type PromptOptimizerProps = {
    mode: PromptOptimizationMode;
    prompt: string;
    disabled: boolean;
    onOptimize: (request: PromptOptimizationRequest) => Promise<string>;
    onUsePrompt: (prompt: string) => void;
};

export function PromptOptimizer({ mode, prompt, disabled, onOptimize, onUsePrompt }: PromptOptimizerProps) {
    const { t } = useI18n();
    const [optimizedPrompt, setOptimizedPrompt] = React.useState('');
    const [sourcePrompt, setSourcePrompt] = React.useState('');
    const [error, setError] = React.useState('');
    const [iterateInstruction, setIterateInstruction] = React.useState('');
    const [isOptimizing, setIsOptimizing] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [applied, setApplied] = React.useState(false);

    const trimmedPrompt = prompt.trim();
    const hasStaleResult = Boolean(optimizedPrompt && sourcePrompt && sourcePrompt !== trimmedPrompt);
    const canIterate = Boolean(optimizedPrompt.trim() && iterateInstruction.trim());

    React.useEffect(() => {
        if (!trimmedPrompt) {
            setOptimizedPrompt('');
            setSourcePrompt('');
            setError('');
            setIterateInstruction('');
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
            const nextPrompt = await onOptimize({ prompt: trimmedPrompt, mode });
            setOptimizedPrompt(nextPrompt);
            setSourcePrompt(trimmedPrompt);
        } catch (optimizeError) {
            setError(optimizeError instanceof Error ? optimizeError.message : t('promptOptimizer.failed'));
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleIterate = async () => {
        const currentOptimizedPrompt = optimizedPrompt.trim();
        const instruction = iterateInstruction.trim();
        if (!currentOptimizedPrompt || !instruction || isOptimizing) return;

        setIsOptimizing(true);
        setError('');
        setCopied(false);
        setApplied(false);

        try {
            const nextPrompt = await onOptimize({
                prompt: currentOptimizedPrompt,
                mode,
                iterateInstruction: instruction
            });
            setOptimizedPrompt(nextPrompt);
            setSourcePrompt(trimmedPrompt);
            setIterateInstruction('');
        } catch (optimizeError) {
            setError(optimizeError instanceof Error ? optimizeError.message : t('promptOptimizer.failed'));
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleUsePrompt = () => {
        const promptToUse = optimizedPrompt.trim();
        if (!promptToUse) return;
        onUsePrompt(promptToUse);
        setSourcePrompt(promptToUse);
        setApplied(true);
    };

    const handleCopy = async () => {
        const promptToCopy = optimizedPrompt.trim();
        if (!promptToCopy) return;
        try {
            await navigator.clipboard.writeText(promptToCopy);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className='flex flex-col gap-2'>
            <div className='jmyr-control flex flex-col gap-3 rounded-md p-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex min-w-0 gap-2'>
                    <span className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-white/75'>
                        <WandSparkles className='size-4' />
                    </span>
                    <div className='min-w-0'>
                        <p className='text-sm font-medium text-white'>{t('promptOptimizer.title')}</p>
                        <p className='mt-0.5 text-xs leading-relaxed text-white/55'>
                            {mode === 'edit' ? t('promptOptimizer.editHint') : t('promptOptimizer.generateHint')}
                        </p>
                    </div>
                </div>
                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleOptimize}
                    disabled={disabled || isOptimizing || !trimmedPrompt}
                    className='jmyr-control shrink-0 border-white/15 px-3 text-white/85 hover:bg-white/10 hover:text-white'>
                    {isOptimizing ? (
                        <Loader2 data-icon='inline-start' className='animate-spin' />
                    ) : (
                        <WandSparkles data-icon='inline-start' />
                    )}
                    {isOptimizing ? t('promptOptimizer.optimizing') : t('promptOptimizer.optimize')}
                </Button>
            </div>

            {error && (
                <Alert variant='destructive' className='border-red-400/25 bg-red-500/10 py-2 text-red-200'>
                    <AlertDescription className='text-xs'>{error}</AlertDescription>
                </Alert>
            )}

            {optimizedPrompt && (
                <div className='rounded-md border border-white/10 bg-white/[0.025] p-3'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='min-w-0'>
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
                                {copied ? <Check data-icon='inline-start' /> : <Copy data-icon='inline-start' />}
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
                    <div className='mt-3 flex flex-col gap-1.5'>
                        <Textarea
                            value={optimizedPrompt}
                            onChange={(event) => {
                                setOptimizedPrompt(event.target.value);
                                setApplied(false);
                                setCopied(false);
                            }}
                            disabled={disabled || isOptimizing}
                            aria-label={t('promptOptimizer.resultTitle')}
                            className='jmyr-control min-h-[150px] resize-y rounded-md text-sm leading-relaxed text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50'
                        />
                        <p className='text-xs text-white/45'>{t('promptOptimizer.editableHint')}</p>
                    </div>
                    <div className='mt-3 flex flex-col gap-2 rounded-md border border-white/10 bg-black/10 p-3'>
                        <p className='text-xs font-medium text-white/65'>{t('promptOptimizer.iterateTitle')}</p>
                        <div className='flex flex-col gap-2 sm:flex-row'>
                            <Input
                                value={iterateInstruction}
                                onChange={(event) => setIterateInstruction(event.target.value)}
                                disabled={disabled || isOptimizing}
                                placeholder={t('promptOptimizer.iteratePlaceholder')}
                                className='jmyr-control h-9 min-w-0 flex-1 rounded-md text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50'
                            />
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleIterate}
                                disabled={disabled || isOptimizing || !canIterate}
                                className='jmyr-control shrink-0 border-white/15 px-3 text-white/85 hover:bg-white/10 hover:text-white'>
                                {isOptimizing ? (
                                    <Loader2 data-icon='inline-start' className='animate-spin' />
                                ) : (
                                    <WandSparkles data-icon='inline-start' />
                                )}
                                {isOptimizing ? t('promptOptimizer.optimizing') : t('promptOptimizer.iterate')}
                            </Button>
                        </div>
                        <p className='text-xs text-white/45'>{t('promptOptimizer.iterateHint')}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
