import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('JmyR defaults point customers at the JmyR gateway and token console', () => {
  const appSettings = read('src/lib/app-settings.tsx');
  const page = read('src/app/page.tsx');

  assert.match(appSettings, /https:\/\/www\.jmyr\.net\/v1/);
  assert.match(page, /new URL\('\/keys'/);
});

test('JmyR branding is visible in metadata and home copy', () => {
  const layout = read('src/app/layout.tsx');
  const i18n = read('src/lib/i18n.tsx');

  assert.match(layout, /JmyR/);
  assert.match(i18n, /JmyR/);
  assert.match(i18n, /JmyR 图片工作台/);
  assert.match(i18n, /文生图/);
  assert.match(i18n, /图生图/);
});

test('JmyR official logo assets are used in the workspace header', () => {
  const page = read('src/app/page.tsx');

  assert.ok(exists('public/jmyr-logo-white.png'));
  assert.ok(exists('public/jmyr-logo-dark.png'));
  assert.match(page, /jmyr-logo-white\.png/);
  assert.match(page, /jmyr-logo-dark\.png/);
});

test('JmyR image workspace only exposes supported image models', () => {
  const appSettings = read('src/lib/app-settings.tsx');
  const page = read('src/app/page.tsx');

  assert.match(appSettings, /supportedImageModelIds = \['gpt-image-2'\]/);
  assert.match(page, /supportedImageModelIds/);
  assert.doesNotMatch(page, /api\/models/);
});

test('image API route avoids logging prompts, request params, or uploaded filenames', () => {
  const route = read('src/app/api/images/route.ts');

  assert.doesNotMatch(route, /Prompt:/);
  assert.doesNotMatch(route, /Calling OpenAI .*params/);
  assert.doesNotMatch(route, /image: `\[/);
});

test('JmyR prompt optimizer is manual, customer-key based, and does not log prompt bodies', () => {
  const page = read('src/app/page.tsx');
  const generationForm = read('src/components/generation-form.tsx');
  const editingForm = read('src/components/editing-form.tsx');
  const optimizer = read('src/components/prompt-optimizer.tsx');
  const route = read('src/app/api/prompts/optimize/route.ts');
  const i18n = read('src/lib/i18n.tsx');

  assert.match(page, /fetch\('\/api\/prompts\/optimize'/);
  assert.match(page, /apiKeyDraft\.trim\(\) \|\| settings\.apiKey\.trim\(\)/);
  assert.match(generationForm, /<PromptOptimizer/);
  assert.match(editingForm, /<PromptOptimizer/);
  assert.match(optimizer, /promptOptimizer\.generateHint/);
  assert.match(optimizer, /promptOptimizer\.editHint/);
  assert.match(optimizer, /onClick=\{handleOptimize\}/);
  assert.match(optimizer, /onClick=\{handleIterate\}/);
  assert.match(optimizer, /<Textarea/);
  assert.match(optimizer, /iterateInstruction/);
  assert.match(route, /DEFAULT_PROMPT_OPTIMIZER_MODEL = 'gpt-5\.4'/);
  assert.match(route, /MAX_ITERATE_INSTRUCTION_LENGTH = 1_000/);
  assert.match(route, /\/chat\/completions/);
  assert.match(route, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(route, /User adjustment/);
  assert.match(i18n, /点“优化提示词”可以补全主体、构图、光线和细节/);
  assert.match(i18n, /这里可以直接编辑/);
  assert.match(i18n, /继续优化/);
  assert.doesNotMatch(route, /console\.(log|warn)\(/);
  assert.doesNotMatch(route, /console\.error\([^;]*(payload|body|messages)/s);
});

test('image API route does not send auto quality to the JmyR image gateway', () => {
  const route = read('src/app/api/images/route.ts');

  assert.match(route, /function normalizeImageQuality\(/);
  assert.match(route, /normalizeImageQuality\(formData\.get\('quality'\), 'medium'\)/);
  assert.doesNotMatch(route, /const quality = \(formData\.get\('quality'\)[^;]+ \|\| 'auto';/);
});

test('JmyR image edit is capped at the verified five source images', () => {
  const page = read('src/app/page.tsx');
  const route = read('src/app/api/images/route.ts');

  assert.match(page, /const MAX_EDIT_IMAGES = 5;/);
  assert.match(route, /const MAX_EDIT_IMAGE_FILES = 5;/);
  assert.match(route, /imageFiles\.length > MAX_EDIT_IMAGE_FILES/);
});

test('send-to-edit can append sources without revoking existing previews', () => {
  const page = read('src/app/page.tsx');

  assert.match(page, /setEditImageFiles\(\(prevFiles\) => \[\.\.\.prevFiles, newFile\]\)/);
  assert.match(page, /setEditSourceImagePreviewUrls\(\(prevUrls\) => \[\.\.\.prevUrls, newPreviewUrl\]\)/);
  assert.match(page, /editSourceImagePreviewUrlsRef/);
  assert.match(page, /function revokeBlobUrl\(/);
  assert.doesNotMatch(page, /editSourceImagePreviewUrls\.forEach\(\(url\) => URL\.revokeObjectURL\(url\)\)/);
});

test('JmyR image workspace exposes clear size tiers and hides moderation controls', () => {
  const page = read('src/app/page.tsx');
  const sizeUtils = read('src/lib/size-utils.ts');
  const sizePicker = read('src/components/size-preset-picker.tsx');
  const generationForm = read('src/components/generation-form.tsx');
  const i18n = read('src/lib/i18n.tsx');

  assert.match(page, /useState<GenerationFormData\['size'\]>\('square_2k'\)/);
  assert.match(page, /useState<EditingFormData\['size'\]>\('square_2k'\)/);
  assert.match(sizeUtils, /square_1k/);
  assert.match(sizeUtils, /square_2k/);
  assert.match(sizeUtils, /square_4k/);
  assert.match(i18n, /1K 标准/);
  assert.match(i18n, /2K 高清/);
  assert.match(i18n, /4K 超清/);
  assert.match(i18n, /1\. 选择清晰度/);
  assert.match(i18n, /2\. 选择画幅/);
  assert.match(sizePicker, /form\.sizeTierGroup/);
  assert.match(sizePicker, /form\.sizeRatioGroup/);
  assert.doesNotMatch(sizePicker, /SIZE_PRESET_OPTIONS\.map/);
  assert.match(i18n, /蒙版用于局部修图/);
  assert.match(generationForm, /moderation: 'auto'/);
  assert.doesNotMatch(generationForm, /common\.moderationLevel/);
  assert.doesNotMatch(generationForm, /setModeration/);
});
