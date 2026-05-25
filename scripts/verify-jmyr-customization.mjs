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
