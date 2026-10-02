#!/usr/bin/env node
/**
 * Strip account-, client- and platform-specific identifiers from a GTM container export
 * before it is stored as an Omnipixel reference setup.
 *
 * Usage:
 *   node scripts/sanitize-gtm-export.mjs <input.json> <output.json> [--redact "brand,shop.dk"]
 *
 * What it does:
 *   - Replaces the GTM account and container IDs everywhere (including cvt_<containerId>_<n> types)
 *   - Replaces the public container ID (GTM-XXXXXXX) and drops version links
 *   - Resets every Constant variable that holds a real value (IDs, tokens, server URLs)
 *   - Masks GA4/Google Ads/GTM IDs, Meta pixel IDs and e-mail addresses found in tag, trigger,
 *     variable, client and transformation settings (custom template code is left untouched)
 *   - Replaces any extra strings passed with --redact (client names, domains)
 * Review the printed report before committing the output.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [input, output, ...rest] = process.argv.slice(2);
if (!input || !output) {
    console.error('Usage: node scripts/sanitize-gtm-export.mjs <input.json> <output.json> [--redact "a,b"]');
    process.exit(1);
}
const redactIndex = rest.indexOf('--redact');
const extraRedactions = redactIndex >= 0 ? rest[redactIndex + 1].split(',').map(s => s.trim()).filter(Boolean) : [];

const PLACEHOLDER_ACCOUNT_ID = '1000000000';
const PLACEHOLDER_CONTAINER_ID = '1000000001';
const PLACEHOLDER_VALUE = 'YOUR_VALUE_HERE';
const PLACEHOLDER_SERVER_URL = 'https://sgtm.yourdomain.com';
const PLACEHOLDER_PATTERN = /^(|YOUR_VALUE_HERE|PUT_YOUR_VALUE_HERE|REPLACE_ME|undefined|true|false|\d{1,3})$/i;

const report = [];
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const replaceId = (text, id, replacement) => text.replace(new RegExp(`(?<!\\d)${escapeRegExp(id)}(?!\\d)`, 'g'), replacement);

let text = readFileSync(input, 'utf8');
const original = JSON.parse(text);
const { accountId, containerId } = original.containerVersion;
const publicId = original.containerVersion.container?.publicId;

text = replaceId(text, accountId, PLACEHOLDER_ACCOUNT_ID);
text = replaceId(text, containerId, PLACEHOLDER_CONTAINER_ID);
report.push(`account ${accountId} -> ${PLACEHOLDER_ACCOUNT_ID}, container ${containerId} -> ${PLACEHOLDER_CONTAINER_ID}`);

if (publicId) {
    const count = text.split(publicId).length - 1;
    text = text.split(publicId).join('GTM-XXXXXXX');
    report.push(`publicId ${publicId} -> GTM-XXXXXXX x${count}`);
}

for (const value of extraRedactions) {
    const count = text.split(value).length - 1;
    text = text.split(value).join('REDACTED');
    report.push(`redacted "${value}" x${count}`);
}

const json = JSON.parse(text);
const cv = json.containerVersion;
delete cv.path;
delete cv.tagManagerUrl;
if (cv.container) {
    delete cv.container.path;
    delete cv.container.tagManagerUrl;
}

for (const variable of cv.variable || []) {
    if (variable.type !== 'c') continue;
    const param = (variable.parameter || []).find(p => p.key === 'value');
    if (!param || typeof param.value !== 'string' || param.value.includes('{{') || PLACEHOLDER_PATTERN.test(param.value)) continue;
    const replacement = /^https?:\/\//i.test(param.value) ? PLACEHOLDER_SERVER_URL : PLACEHOLDER_VALUE;
    report.push(`constant "${variable.name}": "${param.value}" -> "${replacement}"`);
    param.value = replacement;
}

const ID_PATTERNS = [
    { name: 'GA4 measurement ID', re: /\bG-[A-Z0-9]{6,}\b/g, replacement: 'G-XXXXXXXXXX' },
    { name: 'Google Ads ID', re: /\bAW-\d{6,}\b/g, replacement: 'AW-XXXXXXXXX' },
    { name: 'GTM/Google tag ID', re: /\b(GTM|GT)-[A-Z0-9]{6,}\b/g, replacement: 'GTM-XXXXXXX' },
    { name: 'Meta pixel ID', re: /(?<!\d)\d{15,16}(?!\d)/g, replacement: PLACEHOLDER_VALUE },
    { name: 'e-mail address', re: /[\w.+-]+@(?!example\.com\b)[\w-]+\.[\w.-]+/g, replacement: 'user@example.com' },
];

function maskString(value, where) {
    let result = value;
    for (const { name, re, replacement } of ID_PATTERNS) {
        result = result.replace(re, (match) => {
            if (match === replacement) return match;
            report.push(`${name} "${match}" in ${where}`);
            return replacement;
        });
    }
    return result;
}

function walk(node, where) {
    if (Array.isArray(node)) return node.forEach(item => walk(item, where));
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && key === 'value') node[key] = maskString(value, where);
        else if (typeof value === 'object') walk(value, where);
    }
}

for (const section of ['tag', 'trigger', 'variable', 'client', 'transformation', 'zone']) {
    for (const item of cv[section] || []) walk(item.parameter || [], `${section} "${item.name}"`);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(json, null, 2));

console.log(`Sanitized ${input} -> ${output}`);
for (const line of report) console.log(`  - ${line}`);
