import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

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
  assert.match(i18n, /图片生成工作台/);
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
