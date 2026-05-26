import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

type PromptOptimizationMode = 'generate' | 'edit';

type ChatCompletionResponse = {
    choices?: Array<{
        message?: {
            content?: string | null;
        };
    }>;
    error?: {
        message?: string;
    };
};

const DEFAULT_PROMPT_OPTIMIZER_MODEL = 'gpt-5.4';
const PROMPT_OPTIMIZER_TIMEOUT_MS = 90_000;
const MAX_PROMPT_LENGTH = 8_000;
const MAX_ITERATE_INSTRUCTION_LENGTH = 1_000;

function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
    const trimmedBaseUrl = baseUrl?.trim() || process.env.OPENAI_API_BASE_URL?.trim() || 'https://www.jmyr.net/v1';
    return trimmedBaseUrl.replace(/\/+$/, '');
}

function getPreferredLanguage(value: unknown): 'en' | 'zh' {
    return value === 'en' ? 'en' : 'zh';
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

function stripOptimizerWrapper(text: string): string {
    return text
        .trim()
        .replace(/^```(?:\w+)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^(优化后的提示词|提示词|optimized prompt|prompt)\s*[:：]\s*/i, '')
        .trim();
}

function buildMessages(
    prompt: string,
    mode: PromptOptimizationMode,
    language: 'en' | 'zh',
    iterateInstruction?: string
) {
    const outputLanguage =
        language === 'zh'
            ? '优先输出中文；如果用户原提示词主要是英文，则输出英文。'
            : 'Prefer English; if the user prompt is mainly Chinese, output Chinese.';

    if (iterateInstruction) {
        const modeInstruction =
            mode === 'edit'
                ? [
                      'The current prompt is already an image-to-image editing prompt.',
                      'Revise it according to the user adjustment while preserving source-image stability language.',
                      'Keep add/remove/replace/enhance intent explicit when relevant.'
                  ].join('\n')
                : [
                      'The current prompt is already a text-to-image prompt.',
                      'Revise it according to the user adjustment while preserving the core visual idea, subject, composition, lighting, and style continuity.'
                  ].join('\n');

        return [
            {
                role: 'system',
                content: [
                    'You are a prompt iteration assistant for a GPT-image-2 image workspace.',
                    modeInstruction,
                    'Make a focused revision, not a full rewrite unless the adjustment requires it.',
                    'Do not include markdown, headings, explanations, parameter syntax, weights, or negative prompt lists.',
                    'Output only the revised prompt body.',
                    outputLanguage
                ].join('\n')
            },
            {
                role: 'user',
                content: [
                    `Current optimized prompt:\n${prompt}`,
                    `User adjustment:\n${iterateInstruction}`,
                    'Return the updated image prompt.'
                ].join('\n\n')
            }
        ];
    }

    if (mode === 'edit') {
        return [
            {
                role: 'system',
                content: [
                    'You are a prompt optimization assistant for a GPT-image-2 image-to-image workspace.',
                    'Rewrite the user request into a concise, natural image editing prompt.',
                    'Do not claim you can see the source image. The actual source image will be sent later by the image editor.',
                    'Make the edit intent explicit: add, remove, replace, or enhance.',
                    'Tell the image model what should stay consistent: main subject, composition, lighting, perspective, color, and style.',
                    'Do not include markdown, explanations, parameter syntax, weights, or negative prompt lists.',
                    'Output only the optimized prompt body.',
                    outputLanguage
                ].join('\n')
            },
            {
                role: 'user',
                content: `Original image edit request:\n${prompt}\n\nRewrite it for controlled image-to-image editing.`
            }
        ];
    }

    return [
        {
            role: 'system',
            content: [
                'You are a prompt optimization assistant for a GPT-image-2 text-to-image workspace.',
                'Rewrite the user idea into a more controllable image generation prompt.',
                'Preserve all concrete constraints from the original prompt.',
                'Add useful visual detail around subject, action, environment, composition, camera angle, lighting, color, material, texture, and mood.',
                'Keep it direct and natural. Do not add markdown, headings, explanations, parameter syntax, weights, or negative prompt lists.',
                'Output 3 to 6 connected natural-language sentences, and output only the optimized prompt body.',
                outputLanguage
            ].join('\n')
        },
        {
            role: 'user',
            content: `Original text-to-image prompt:\n${prompt}\n\nRewrite it as a stronger image generation prompt.`
        }
    ];
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as Record<string, unknown>;

        if (process.env.APP_PASSWORD) {
            const clientPasswordHash = typeof payload.passwordHash === 'string' ? payload.passwordHash : '';
            if (!clientPasswordHash) {
                return NextResponse.json({ error: 'Unauthorized: Missing password hash.' }, { status: 401 });
            }
            if (clientPasswordHash !== sha256(process.env.APP_PASSWORD)) {
                return NextResponse.json({ error: 'Unauthorized: Invalid password.' }, { status: 401 });
            }
        }

        const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
        const iterateInstruction =
            typeof payload.iterateInstruction === 'string' ? payload.iterateInstruction.trim() : '';
        const mode = payload.mode === 'edit' ? 'edit' : payload.mode === 'generate' ? 'generate' : null;
        const apiKey = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : process.env.OPENAI_API_KEY?.trim();
        const baseUrl = normalizeBaseUrl(typeof payload.baseUrl === 'string' ? payload.baseUrl : undefined);
        const responseLanguage = getPreferredLanguage(payload.responseLanguage);
        const model = process.env.PROMPT_OPTIMIZER_MODEL?.trim() || DEFAULT_PROMPT_OPTIMIZER_MODEL;

        if (!prompt || !mode) {
            return NextResponse.json({ error: 'Missing required parameters: prompt and mode.' }, { status: 400 });
        }
        if (prompt.length > MAX_PROMPT_LENGTH) {
            return NextResponse.json({ error: 'Prompt is too long to optimize.' }, { status: 400 });
        }
        if (iterateInstruction.length > MAX_ITERATE_INSTRUCTION_LENGTH) {
            return NextResponse.json({ error: 'Adjustment instruction is too long.' }, { status: 400 });
        }
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not found.' }, { status: 500 });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PROMPT_OPTIMIZER_TIMEOUT_MS);

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept-Language': responseLanguage === 'zh' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9'
                },
                body: JSON.stringify({
                    model,
                    messages: buildMessages(prompt, mode, responseLanguage, iterateInstruction || undefined),
                    stream: false
                })
            });

            const result = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
            if (!response.ok) {
                console.error('Prompt optimization request failed:', {
                    status: response.status,
                    model
                });
                return NextResponse.json(
                    { error: result.error?.message || `Prompt optimization failed with status ${response.status}.` },
                    { status: response.status }
                );
            }

            const optimizedPrompt = stripOptimizerWrapper(result.choices?.[0]?.message?.content ?? '');
            if (!optimizedPrompt) {
                return NextResponse.json({ error: 'Prompt optimizer returned an empty result.' }, { status: 502 });
            }

            return NextResponse.json({ optimizedPrompt, model });
        } finally {
            clearTimeout(timeout);
        }
    } catch (error) {
        console.error('Prompt optimization failed:', {
            type: error instanceof Error ? error.name : typeof error
        });

        return NextResponse.json(
            { error: `Prompt optimization failed: ${getErrorMessage(error)}` },
            { status: 500 }
        );
    }
}
