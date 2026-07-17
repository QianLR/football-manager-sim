import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ENGLISH_TRANSLATIONS, translateRenderedText } from '../src/i18n/translations.js';

const require = createRequire(import.meta.url);
const espree = require('espree');

const files = execFileSync('rg', [
  '-l', '[\\p{Han}]', 'src', '--glob', '*.js', '--glob', '*.jsx', '--glob', '*.json'
], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(file => file && !file.includes('/i18n/'));

const strings = new Set();
const templates = new Set();

function addJsonStrings(value) {
  if (typeof value === 'string' && /[\u3400-\u9fff]/.test(value)) strings.add(value);
  else if (Array.isArray(value)) value.forEach(addJsonStrings);
  else if (value && typeof value === 'object') Object.values(value).forEach(addJsonStrings);
}

function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXText') {
    const value = node.value.trim();
    if (value && /[\u3400-\u9fff]/.test(value)) strings.add(value);
  }
  if (node.type === 'Literal' && typeof node.value === 'string' && /[\u3400-\u9fff]/.test(node.value)) {
    strings.add(node.value);
  }
  if (node.type === 'TemplateLiteral') {
    const value = node.quasis.map((part, index) => `${part.value.cooked || ''}${index < node.expressions.length ? '${…}' : ''}`).join('');
    if (/[\u3400-\u9fff]/.test(value)) templates.add(value);
  }
  for (const [key, child] of Object.entries(node)) {
    if (key === 'parent') continue;
    if (Array.isArray(child)) child.forEach(visit);
    else if (child && typeof child === 'object' && typeof child.type === 'string') visit(child);
  }
}

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (file.endsWith('.json')) addJsonStrings(JSON.parse(source));
  else visit(espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } }));
}

const missing = [...strings]
  .filter(value => ENGLISH_TRANSLATIONS[value] === undefined)
  .sort((a, b) => a.length - b.length || a.localeCompare(b, 'zh'));

console.log(`Chinese strings: ${strings.size}`);
console.log(`Exact translations: ${strings.size - missing.length}`);
console.log(`Missing exact translations: ${missing.length}`);
for (const value of missing) console.log(value.replaceAll('\n', '\\n'));
const uncoveredTemplates = [...templates].filter(value => /[\u3400-\u9fff]/.test(translateRenderedText(value.replaceAll('${…}', 'TEST'))));
console.log(`Dynamic templates: ${templates.size}`);
console.log(`Uncovered dynamic templates: ${uncoveredTemplates.length}`);
for (const value of uncoveredTemplates.sort((a, b) => a.length - b.length)) console.log(`[template] ${value.replaceAll('\n', '\\n')}`);

const placeholderPattern = /\[(名字|俱乐部|执教理念|教练名字|俱乐部名字|青训名字)\]/g;
const placeholderTemplates = Object.keys(ENGLISH_TRANSLATIONS)
  .filter(value => {
    placeholderPattern.lastIndex = 0;
    return placeholderPattern.test(value);
  });
const uncoveredPlaceholderTemplates = placeholderTemplates.filter(value => {
  placeholderPattern.lastIndex = 0;
  const rendered = value.replace(placeholderPattern, 'TEST');
  return /[\u3400-\u9fff]/.test(translateRenderedText(rendered));
});
console.log(`Placeholder templates: ${placeholderTemplates.length}`);
console.log(`Uncovered placeholder templates: ${uncoveredPlaceholderTemplates.length}`);
for (const value of uncoveredPlaceholderTemplates) console.log(`[placeholder] ${value.replaceAll('\n', '\\n')}`);

if (missing.length || uncoveredTemplates.length || uncoveredPlaceholderTemplates.length) {
  process.exitCode = 1;
}
