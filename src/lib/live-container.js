import { BUILT_IN_TYPES, buildEventMatrix, galleryTemplateNames, normalizePlatform } from './reference-setups.js';

/**
 * Fetches a published GTM web container (gtm.js) and digests it into the same shape as
 * get_reference_setup, so a live container can be diffed against a reference setup.
 * gtm.js carries no tag, trigger or variable names, and no server container.
 */

const FETCH_TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_LOOKUP_ENTRIES = 15;
const MAX_EXPANDED_VALUES = 20;
const MAX_UNFILTERED_CHARS = 40000;

const LIVE_TYPES = {
    ...BUILT_IN_TYPES,
    flc: 'Floodlight Counter',
    fls: 'Floodlight Sales',
    bzi: 'LinkedIn Insight',
    hjtc: 'Hotjar Tracking Code',
    img: 'Custom Image',
    ua: 'Universal Analytics',
    zone: 'Zone',
    awud: 'Google Ads User-Provided Data Event',
    smm: 'Lookup Table',
    remm: 'RegEx Table',
    e: 'Event',
    f: 'Referrer',
    j: 'JavaScript Variable',
    d: 'DOM Element',
    aev: 'Auto-Event Variable',
    r: 'Random Number',
    ctv: 'Container Version',
    cid: 'Container ID',
    dbg: 'Debug Mode',
};

const BUILT_IN_PLATFORMS = {
    gaawe: 'ga4',
    ua: 'universal_analytics',
    awct: 'google_ads',
    sp: 'google_ads',
    gclidw: 'google_ads',
    awud: 'google_ads',
    flc: 'floodlight',
    fls: 'floodlight',
    baut: 'microsoft_ads',
    pntr: 'pinterest',
    bzi: 'linkedin',
    hjtc: 'hotjar',
    img: 'custom_image',
};

const AUTO_EVENT_LISTENERS = {
    cl: 'gtm.click',
    lcl: 'gtm.linkClick',
    fsl: 'gtm.formSubmit',
    sdl: 'gtm.scrollDepth',
    evl: 'gtm.elementVisibility',
    tl: 'gtm.timer',
    hl: 'gtm.historyChange',
    jel: 'gtm.pageError',
    ytl: 'gtm.video',
};

// Matched against custom template names, permission URLs/globals and Custom HTML code.
const PLATFORM_HINTS = [
    [/stapecdn\.com\/dtag|dataTagSendData|data tag/i, 'data_tag'],
    [/facebook|fbevents|\bfbq\b|meta pixel/i, 'meta'],
    [/tiktok|\bttq\b/i, 'tiktok'],
    [/licdn|lintrk|linkedin/i, 'linkedin'],
    [/snapchat|sc-static\.net|snaptr/i, 'snapchat'],
    [/pinimg|pintrk|pinterest/i, 'pinterest'],
    [/redditstatic|reddit|\brdt\(/i, 'reddit'],
    [/klaviyo/i, 'klaviyo'],
    [/bat\.bing|\buetq\b|microsoft|\bbing\b/i, 'microsoft_ads'],
    [/clarity/i, 'clarity'],
    [/hotjar|\bhj\(/i, 'hotjar'],
    [/openai|\boaiq\b/i, 'openai'],
    [/criteo/i, 'criteo'],
    [/adtraction|adt313/i, 'adtraction'],
    [/googletagmanager|\bgtag\(/i, 'google'],
];

const SECRET_PATTERNS = [
    [/EAA[A-Za-z0-9]{30,}/, 'meta_access_token'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private_key'],
    [/\bsk_(live|test)_[A-Za-z0-9]{10,}/, 'stripe_secret_key'],
    [/\bpk_[a-f0-9]{30,}/, 'klaviyo_private_key'],
    [/\bAIza[0-9A-Za-z_-]{35}\b/, 'google_api_key'],
    [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'slack_token'],
    [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'github_token'],
    [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'jwt'],
];
const SECRET_KEY_NAME = /(access_?token|api_?secret|api_?key|secret|password|private_?key|auth_?token|bearer)/i;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\+\d{1,3}[\s-]?\d{2,4}[\s-]?\d{2,4}[\s-]?\d{2,4}\b/g;

const ID_PARAM = /^(tagId|measurementId|measurementIdOverride|pixelId|pixel_id|partnerId|conversionId|tagID|uetqTagId|advertiserId|accountId|ti|ap|campaignId|siteId)$/i;
const SERVER_URL_PARAM = /server_container_url|transport_url|gtm_server_domain|serverContainerUrl|server_?url|data_tag_load_script_url/i;
const SERVER_HOST_HINT = /^(https?:\/\/)?(sgtm|sst|ss|gtm|server|tagging|track|data|load|metrics)\.[a-z0-9-]+\.[a-z.]+/i;

const fetchCache = new Map();

function findSecret(value, key = '') {
    if (typeof value !== 'string') return null;
    for (const [pattern, kind] of SECRET_PATTERNS) {
        if (pattern.test(value)) return kind;
    }
    if (SECRET_KEY_NAME.test(key) && value.length >= 16 && !/^\{\{.*\}\}$/.test(value) && !/\s/.test(value)) {
        return `credential in parameter "${key}"`;
    }
    return null;
}

function extractData(js) {
    const marker = js.indexOf('var data = ');
    if (marker === -1) return null;
    const start = marker + 'var data = '.length;
    let depth = 0;
    let inString = false;
    let quote = '';
    for (let i = start; i < js.length; i++) {
        const c = js[i];
        if (inString) {
            if (c === '\\') i++;
            else if (c === quote) inString = false;
            continue;
        }
        if (c === '"' || c === "'") { inString = true; quote = c; continue; }
        if (c === '{' || c === '[') depth++;
        if (c === '}' || c === ']') {
            depth--;
            if (depth === 0) return JSON.parse(js.slice(start, i + 1));
        }
    }
    return null;
}

export async function fetchLiveContainer(containerId) {
    const id = String(containerId || '').trim().toUpperCase();
    if (!/^GTM-[A-Z0-9]{4,12}$/.test(id)) {
        throw new Error(`"${containerId}" is not a GTM web container ID (expected GTM-XXXXXXX). gtag.js IDs (G-, AW-, GT-) are not GTM containers.`);
    }

    const cached = fetchCache.get(id);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

    let response;
    try {
        response = await fetch(`https://www.googletagmanager.com/gtm.js?id=${id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Omnipixel/2.0)' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
    } catch (error) {
        throw new Error(`Could not fetch ${id} from googletagmanager.com: ${error.message}`);
    }
    if (!response.ok) {
        throw new Error(`Could not fetch ${id}: googletagmanager.com returned HTTP ${response.status}. The container may not exist, may be unpublished, or is only served through a first-party loader.`);
    }

    const raw = await response.text();
    let data;
    try {
        data = extractData(raw);
    } catch (error) {
        throw new Error(`Fetched ${id} but could not parse its resource: ${error.message}`);
    }
    if (!data?.resource) {
        throw new Error(`Fetched ${id} but it contains no container resource (empty or unpublished container).`);
    }

    const value = { id, raw, data };
    fetchCache.set(id, { at: Date.now(), value });
    return value;
}

const stripVtp = (key) => key.replace(/^vtp_/, '');

function createContext(id, data) {
    const resource = data.resource;
    const macros = resource.macros || [];
    const templateNames = galleryTemplateNames();
    const secrets = [];

    const ctx = { id, data, resource, macros, secrets };

    ctx.macroLabel = (n) => {
        const m = macros[n];
        if (!m) return `macro ${n}`;
        const fn = m.function.replace(/^__/, '');
        switch (fn) {
            case 'e': return 'Event';
            case 'v': return `dlv: ${m.vtp_name}`;
            case 'c': {
                const kind = findSecret(m.vtp_value, 'value');
                return `const: ${kind ? `[secret redacted: ${kind}]` : ctx.render(m.vtp_value)}`;
            }
            case 'k': return `cookie: ${m.vtp_name}`;
            case 'u': return `url: ${(m.vtp_component || 'URL').toLowerCase()}`;
            case 'jsm': {
                const uses = [...referencedMacros(m.vtp_javascript)].filter(r => r !== n).map(ctx.macroLabel);
                return `custom js #${n}${uses.length ? ` reading ${uses.slice(0, 2).join(', ')}` : ''}`;
            }
            case 'j': return `js var: ${m.vtp_name}`;
            case 'smm': case 'remm': return `${fn === 'smm' ? 'lookup' : 'regex lookup'} #${n} on ${ctx.render(m.vtp_input)}`;
            case 'awec': return `user-provided data #${n}`;
            case 'aev': return `auto-event: ${(m.vtp_varType || '').toLowerCase()}`;
            default: return `${ctx.typeLabel(m.function)} #${n}`;
        }
    };

    ctx.typeLabel = (fn) => {
        const key = fn.replace(/^__/, '');
        if (templateNames[key]) return templateNames[key];
        if (LIVE_TYPES[key]) return LIVE_TYPES[key];
        if (/^cvt_[A-Z0-9]{5}$/.test(key)) return `Gallery template ${key.slice(4)} (${ctx.inferPlatform(fn) || 'unknown platform'})`;
        if (key.startsWith('cvt_')) return `Custom template (${ctx.inferPlatform(fn) || 'unknown platform'})`;
        return key;
    };

    ctx.safe = (value, key, where) => {
        const kind = findSecret(value, key);
        if (!kind) return value;
        secrets.push({ where, kind });
        return { secretExposed: true, kind };
    };

    // Code is rendered unredacted so codeSummary can scan it; the code itself is never returned.
    ctx.renderCode = (value) => {
        ctx.rawStrings = true;
        try {
            const code = ctx.render(value);
            return typeof code === 'string' ? code : '';
        } finally {
            ctx.rawStrings = false;
        }
    };

    ctx.render = (value, key = '', where = '', depth = 0) => {
        if (depth > 12) return '…';
        if (typeof value === 'string') return ctx.rawStrings ? value : ctx.safe(value, key, where);
        if (!Array.isArray(value)) return value;
        const [op, ...rest] = value;
        switch (op) {
            case 'macro': return `{{${ctx.macroLabel(rest[0])}}}`;
            case 'escape': return ctx.render(rest[0], key, where, depth + 1);
            case 'template': return rest.map(p => {
                const r = ctx.render(p, key, where, depth + 1);
                return typeof r === 'string' ? r : JSON.stringify(r);
            }).join('');
            case 'list': return flattenTable(rest.map(v => ctx.render(v, key, where, depth + 1)));
            case 'map': {
                const obj = {};
                for (let i = 0; i < rest.length; i += 2) obj[rest[i]] = ctx.render(rest[i + 1], rest[i], where, depth + 1);
                return obj;
            }
            case 'tag': return `tag ${resource.tags[rest[0]]?.tag_id ?? rest[0]}`;
            default: return value.map(v => ctx.render(v, key, where, depth + 1));
        }
    };

    ctx.expandValues = (value, depth = 0) => {
        if (depth > 6) return [];
        if (typeof value === 'string' || typeof value === 'number') return [String(value)];
        if (!Array.isArray(value)) return [];
        const [op, ...rest] = value;
        if (op === 'escape') return ctx.expandValues(rest[0], depth + 1);
        if (op === 'template') {
            return rest.reduce((acc, part) => {
                const options = ctx.expandValues(part, depth + 1);
                const next = [];
                for (const a of acc) for (const o of (options.length ? options : [''])) next.push(a + o);
                return next.slice(0, MAX_EXPANDED_VALUES);
            }, ['']);
        }
        if (op === 'macro') {
            const m = macros[rest[0]];
            if (!m) return [];
            if (m.function === '__c') return ctx.expandValues(m.vtp_value, depth + 1);
            if (m.function === '__smm' || m.function === '__remm') {
                const entries = (m.vtp_map || []).slice(1).map(e => e[4]);
                const values = entries.flatMap(v => ctx.expandValues(v, depth + 1));
                if (m.vtp_setDefaultValue) values.push(...ctx.expandValues(m.vtp_defaultValue, depth + 1));
                return [...new Set(values)].slice(0, MAX_EXPANDED_VALUES);
            }
            return [`{{${ctx.macroLabel(rest[0])}}}`];
        }
        return [];
    };

    ctx.inferPlatform = (fn) => {
        const key = fn.replace(/^__/, '');
        const perms = data.permissions?.[fn] || {};
        const consentWriter = perms.access_consent?.consentTypes?.some(t => t.write);
        if (consentWriter && !perms.inject_script) return 'consent';
        const hints = [
            templateNames[key] || '',
            ...['inject_script', 'send_pixel', 'send_http', 'inject_hidden_iframe'].flatMap(p => perms[p]?.urls || []),
            ...(perms.access_globals?.keys || []).map(k => k.key),
        ].join(' ');
        return PLATFORM_HINTS.find(([pattern]) => pattern.test(hints))?.[1] || null;
    };

    return ctx;
}

// GTM stores table parameters as lists of {parameter, parameterValue} maps; turn them into plain objects.
function flattenTable(list) {
    const pairKeys = [['parameter', 'parameterValue'], ['name', 'value'], ['key', 'value']];
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    for (const [k, v] of pairKeys) {
        if (list.length && list.every(item => isObj(item) && k in item && Object.keys(item).length <= 3)) {
            return Object.fromEntries(list.map(item => [item[k], item[v]]));
        }
    }
    return list;
}

function referencedMacros(value, out = new Set()) {
    if (!Array.isArray(value)) {
        if (value && typeof value === 'object') Object.values(value).forEach(v => referencedMacros(v, out));
        return out;
    }
    if (value[0] === 'macro' && typeof value[1] === 'number') out.add(value[1]);
    else value.forEach(v => referencedMacros(v, out));
    return out;
}

function codeSummary(code, ctx, where) {
    const text = typeof code === 'string' ? code : '';
    for (const [pattern, kind] of SECRET_PATTERNS) {
        if (pattern.test(text)) ctx.secrets.push({ where, kind });
    }
    const hosts = [...new Set([...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map(m => m[1].toLowerCase()))].slice(0, 8);
    const events = [...new Set([...text.matchAll(/['"]?event['"]?\s*:\s*['"]([\w.-]+)['"]/g)].map(m => m[1]))].slice(0, 8);
    const platforms = [...new Set(PLATFORM_HINTS.filter(([p]) => p.test(text)).map(([, name]) => name))];
    return {
        length: text.length,
        ...(platforms.length ? { platforms } : {}),
        ...(hosts.length ? { contactsHosts: hosts } : {}),
        ...(events.length ? { pushesEvents: events } : {}),
        ...(/document\.cookie/.test(text) ? { readsOrWritesCookies: true } : {}),
        ...(/document\.write/.test(text) ? { usesDocumentWrite: true } : {}),
    };
}

const PREDICATE_OPS = {
    _eq: 'equals', _cn: 'contains', _sw: 'starts with', _ew: 'ends with', _re: 'matches regex',
    _css: 'matches CSS selector', _lt: '<', _le: '<=', _gt: '>', _ge: '>=',
};

function buildTriggers(ctx) {
    const { resource, macros } = ctx;
    const isEventMacro = (arg) => Array.isArray(arg) && arg[0] === 'macro' && macros[arg[1]]?.function === '__e';
    const isTriggersMacro = (arg) => Array.isArray(arg) && arg[0] === 'macro' && macros[arg[1]]?.vtp_name === 'gtm.triggers';

    const groupDefs = {};
    const listeningTagGroup = {};
    resource.tags.forEach((tag, i) => {
        if (tag.function !== '__tg') return;
        if (tag.vtp_uniqueTriggerId) groupDefs[tag.vtp_uniqueTriggerId] = true;
        if (tag.vtp_firingId) listeningTagGroup[i] = tag.vtp_firingId.split('_').slice(0, 2).join('_');
    });

    const rules = resource.rules.map((clauses, index) => {
        const get = (op) => clauses.filter(c => c[0] === op).flatMap(c => c.slice(1));
        const ifs = get('if').map(p => resource.predicates[p]);
        const unless = get('unless').map(p => resource.predicates[p]);
        const events = [];
        const conditions = [];
        let groupId = null;
        let eventIsTriggerGroup = false;

        for (const p of ifs) {
            if (isEventMacro(p.arg0) && p.function === '_eq') {
                if (p.arg1 === 'gtm.triggerGroup') eventIsTriggerGroup = true;
                else events.push(p.arg1);
            } else if (isEventMacro(p.arg0)) {
                events.push(`regex:${p.arg1}`);
            } else if (isTriggersMacro(p.arg0)) {
                groupId = Object.keys(groupDefs).find(g => String(p.arg1).includes(g)) || groupId;
            } else {
                conditions.push(`${ctx.render(p.arg0)} ${PREDICATE_OPS[p.function] || p.function} "${p.arg1}"`);
            }
        }
        for (const p of unless) {
            if (isTriggersMacro(p.arg0)) continue;
            conditions.push(`NOT ${ctx.render(p.arg0)} ${PREDICATE_OPS[p.function] || p.function} "${p.arg1}"`);
        }

        return {
            index,
            events,
            conditions,
            groupId: eventIsTriggerGroup ? groupId : null,
            adds: get('add'),
            blocks: get('block'),
        };
    });

    const ruleKey = (rule) => rule.events.length ? rule.events.join(' | ') : 'any event';
    const ruleText = (rule) => `${ruleKey(rule)}${rule.conditions.length ? ` when ${rule.conditions.join(' and ')}` : ''}`;

    const groupComponents = {};
    for (const rule of rules) {
        for (const t of rule.adds) {
            const g = listeningTagGroup[t];
            if (g) (groupComponents[g] ||= []).push(rule);
        }
    }

    for (const rule of rules) {
        if (rule.groupId) {
            const parts = groupComponents[rule.groupId] || [];
            rule.eventKey = parts.map(ruleKey).sort().join(' + ') || 'trigger group';
            rule.description = `trigger group: ${parts.map(r => `(${ruleText(r)})`).join(' + ')}${rule.conditions.length ? ` when ${rule.conditions.join(' and ')}` : ''}`;
        } else {
            rule.eventKey = ruleKey(rule);
            rule.description = ruleText(rule);
        }
    }
    return rules;
}

function tagEvent(fn, params, firesOnEvents) {
    if (fn === 'googtag') return 'config';
    if (fn === 'gclidw') return 'conversion_linker';
    if (fn === 'awct') return firesOnEvents.find(e => !e.startsWith('gtm.')) || 'conversion';
    if (fn === 'sp') return 'remarketing';
    const pick = (...keys) => keys.map(k => params[k]).find(v => typeof v === 'string' && v && v.length < 60);
    let event = pick('eventName', 'event_name', 'eventNameStandard', 'standardEventName', 'event_type', 'eventType', 'event', 'customEventName', 'type');
    if (/^(standard|custom|CUSTOM|STANDARD|inherit)$/.test(event || '')) {
        event = pick('standardEventName', 'eventNameStandard', 'event_name_standard', 'customEventName', 'event_name_custom', 'event_name') || event;
    }
    if (event) return event;
    return firesOnEvents.find(e => !e.startsWith('gtm.')) || null;
}

function digestLiveContainer(ctx, { platform, includeParameters }) {
    const { resource, data } = ctx;
    // Digest every variable once so secrets are reported even when a platform filter hides them.
    ctx.macros.forEach((_, i) => digestMacro(i, ctx));
    const rules = buildTriggers(ctx);
    const firing = {};
    const blocking = {};
    for (const rule of rules) {
        rule.adds.forEach(t => (firing[t] ||= []).push(rule));
        rule.blocks.forEach(t => (blocking[t] ||= []).push(rule));
    }

    const listeners = new Set();
    const customHtml = [];
    const serverContainerUrls = [];
    const allTags = [];
    const tagMacroRefs = new Map();

    resource.tags.forEach((tag, index) => {
        const fn = tag.function.replace(/^__/, '');
        if (fn === 'tg') return;
        if (AUTO_EVENT_LISTENERS[fn]) { listeners.add(AUTO_EVENT_LISTENERS[fn]); return; }

        const paused = fn === 'paused';
        const realFn = paused ? tag.vtp_originalTagType : fn;
        const where = `tag ${tag.tag_id}`;

        const params = {};
        for (const [key, value] of Object.entries(tag)) {
            if (!key.startsWith('vtp_') || key === 'vtp_html' || key === 'vtp_javascript' || key === 'vtp_originalTagType') continue;
            params[stripVtp(key)] = ctx.render(value, stripVtp(key), `${where} parameter "${stripVtp(key)}"`);
        }

        let tagPlatform = BUILT_IN_PLATFORMS[realFn] || null;
        if (realFn === 'googtag') {
            const ids = ctx.expandValues(tag.vtp_tagId);
            tagPlatform = ids.some(i => /^AW-/.test(i)) ? 'google_ads' : ids.some(i => /^G-/.test(i)) ? 'ga4' : 'google_tag';
        } else if (realFn?.startsWith('cvt_')) {
            tagPlatform = ctx.inferPlatform(`__${realFn}`) || 'custom_template';
        } else if (realFn === 'html') {
            const summary = codeSummary(ctx.renderCode(tag.vtp_html), ctx, `${where} (Custom HTML)`);
            tagPlatform = summary.platforms?.[0] || 'custom_html';
            customHtml.push({ id: tag.tag_id, platform: tagPlatform, ...summary });
        }
        tagPlatform = normalizePlatform(tagPlatform || realFn || 'other');

        const fires = firing[index] || [];
        const firesOnEvents = fires.map(r => r.eventKey);
        const ids = [...new Set(Object.entries(tag)
            .filter(([k]) => ID_PARAM.test(stripVtp(k)))
            .flatMap(([, v]) => ctx.expandValues(v)))];

        serverContainerUrls.push(...findServerUrls(tag, tagPlatform, ctx));

        const digest = {
            id: tag.tag_id,
            platform: tagPlatform,
            type: ctx.typeLabel(`__${realFn || fn}`),
            function: `__${realFn || fn}`,
            event: paused ? null : tagEvent(realFn, params, firesOnEvents),
            firesOn: fires.map(r => r.description),
            firesOnEvents,
            consent: Array.isArray(tag.consent) && tag.consent.length > 1 ? `requires ${tag.consent.slice(1).join(', ')}` : 'none',
        };
        if (blocking[index]) digest.blockedBy = blocking[index].map(r => r.description);
        if (paused) digest.paused = true;
        if (ids.length) digest.ids = ids;
        if (tag.once_per_load) digest.firing = 'once per page';
        const setup = tag.setup_tags?.slice(1).map(t => resource.tags[t[1]]?.tag_id);
        const teardown = tag.teardown_tags?.slice(1).map(t => resource.tags[t[1]]?.tag_id);
        if (setup?.length) digest.setupTags = setup;
        if (teardown?.length) digest.teardownTags = teardown;
        if (includeParameters) digest.parameters = expandUserData(params, tag, ctx);

        allTags.push(digest);
        tagMacroRefs.set(digest, referencedMacros(tag));
    });

    const tags = platform ? allTags.filter(t => t.platform === platform) : allTags;
    const platforms = [...new Set(allTags.map(t => t.platform))];

    const usedRules = new Set(tags.flatMap(t => [...t.firesOn, ...(t.blockedBy || [])]));
    const triggers = rules
        .filter(r => usedRules.has(r.description))
        .map(r => ({ events: r.eventKey, condition: r.description, tags: r.adds.length }));

    const usedMacros = new Set();
    const queue = [...tags.flatMap(t => [...(tagMacroRefs.get(t) || [])])];
    while (queue.length) {
        const n = queue.pop();
        if (usedMacros.has(n)) continue;
        usedMacros.add(n);
        referencedMacros(ctx.macros[n]).forEach(m => queue.push(m));
    }
    const variableIndexes = platform ? [...usedMacros].sort((a, b) => a - b) : ctx.macros.map((_, i) => i);
    const variables = variableIndexes.map(i => digestMacro(i, ctx)).filter(Boolean);

    const idsByPlatform = {};
    for (const t of allTags.filter(t => !t.paused && t.ids)) {
        idsByPlatform[t.platform] = [...new Set([...(idsByPlatform[t.platform] || []), ...t.ids])];
    }

    const groupedServerUrls = new Map();
    for (const { tagId, ...entry } of serverContainerUrls) {
        const key = `${entry.urls.join(',')}|${entry.setting}|${entry.platform}`;
        if (!groupedServerUrls.has(key)) groupedServerUrls.set(key, { ...entry, tagIds: [] });
        groupedServerUrls.get(key).tagIds.push(tagId);
    }

    const result = {
        container: ctx.id,
        usage: 'web',
        source: 'live gtm.js (published version)',
        version: resource.version,
        platforms,
        tagCount: tags.length,
        pausedTagCount: tags.filter(t => t.paused).length,
        eventMatrix: buildEventMatrix(tags),
        tags,
        triggers,
        variables,
        idsByPlatform,
        serverContainerUrls: [...groupedServerUrls.values()],
        secretsExposed: dedupeSecrets(ctx.secrets),
    };
    if (customHtml.length) result.customHtml = platform ? customHtml.filter(h => h.platform === platform) : customHtml;
    if (!platform && listeners.size) result.autoEventListeners = [...listeners];
    if (!platform) {
        result.customTemplates = (data.sandboxed_scripts || []).map(fn => ({
            function: fn,
            name: ctx.typeLabel(fn),
            platform: ctx.inferPlatform(fn),
        }));
    }
    if (!platform && JSON.stringify(result).length > MAX_UNFILTERED_CHARS) return toOverview(result);
    return result;
}

// Large containers without a platform filter: keep the overview and drop per-tag detail.
function toOverview(result) {
    const { tags, triggers, variables, customHtml, ...overview } = result;
    const tagsPerPlatform = {};
    for (const tag of tags) {
        const entry = (tagsPerPlatform[tag.platform] ||= { active: 0, paused: 0, consent: {} });
        entry[tag.paused ? 'paused' : 'active']++;
        if (!tag.paused) entry.consent[tag.consent] = (entry.consent[tag.consent] || 0) + 1;
    }
    return {
        ...overview,
        tagsPerPlatform,
        ...(customHtml ? { customHtmlCount: customHtml.length, customHtmlPlatforms: [...new Set(customHtml.map(h => h.platform))] } : {}),
        variableCount: variables.length,
        truncated: `Per-tag detail omitted (${tags.length} tags, ${triggers.length} triggers). Call again with platform set to one of: ${result.platforms.join(', ')}.`,
    };
}

function findServerUrls(tag, tagPlatform, ctx) {
    const found = [];
    const add = (values, setting, heuristic) => {
        const urls = values.filter(v => !heuristic || SERVER_HOST_HINT.test(v));
        if (urls.length) found.push({ urls, setting, platform: tagPlatform, tagId: tag.tag_id, ...(heuristic ? { heuristic: 'host looks like a tagging server, but the setting is not server_container_url' } : {}) });
    };

    for (const [key, value] of Object.entries(tag)) {
        if (!key.startsWith('vtp_')) continue;
        const k = stripVtp(key);
        if (SERVER_URL_PARAM.test(k)) {
            add(ctx.expandValues(value), k, false);
            continue;
        }
        // Settings tables: ["list", ["map", "parameter", name, "parameterValue", value], ...]
        if (Array.isArray(value) && value[0] === 'list') {
            for (const row of value.slice(1)) {
                if (!Array.isArray(row) || row[0] !== 'map') continue;
                const name = row[2];
                const rowValue = row[4];
                if (typeof name !== 'string') continue;
                add(ctx.expandValues(rowValue), `${k}.${name}`, !SERVER_URL_PARAM.test(name));
            }
        }
    }
    return found;
}

function expandUserData(params, tag, ctx) {
    const out = { ...params };
    for (const [key, value] of Object.entries(tag)) {
        const refs = [...referencedMacros(value)].filter(n => ctx.macros[n]?.function === '__awec');
        if (!refs.length) continue;
        out[`${stripVtp(key)} (user-provided data fields)`] = refs.map(n => digestMacro(n, ctx).fields);
    }
    return out;
}

function digestMacro(n, ctx) {
    const m = ctx.macros[n];
    if (!m) return null;
    const fn = m.function.replace(/^__/, '');
    const base = { ref: `{{${ctx.macroLabel(n)}}}`, type: ctx.typeLabel(m.function) };
    const where = `variable #${n}`;
    switch (fn) {
        case 'v': return { ...base, source: m.vtp_name };
        case 'k': return { ...base, source: m.vtp_name };
        case 'c': return { ...base, value: ctx.render(m.vtp_value, 'value', where) };
        case 'u': return { ...base, source: m.vtp_component };
        case 'j': return { ...base, source: m.vtp_name };
        case 'smm':
        case 'remm': {
            const entries = (m.vtp_map || []).slice(1);
            const table = Object.fromEntries(entries.slice(0, MAX_LOOKUP_ENTRIES).map(e => [e[2], ctx.render(e[4], String(e[2]), where)]));
            return {
                ...base,
                input: ctx.render(m.vtp_input),
                table,
                ...(entries.length > MAX_LOOKUP_ENTRIES ? { moreEntries: entries.length - MAX_LOOKUP_ENTRIES } : {}),
                ...(m.vtp_setDefaultValue ? { default: ctx.render(m.vtp_defaultValue, 'default', where) } : {}),
            };
        }
        case 'jsm': {
            return { ...base, summary: codeSummary(ctx.renderCode(m.vtp_javascript), ctx, `${where} (Custom JavaScript)`), uses: [...referencedMacros(m.vtp_javascript)].map(r => `{{${ctx.macroLabel(r)}}}`) };
        }
        case 'awec': {
            const fields = {};
            for (const [key, value] of Object.entries(m)) {
                if (key.startsWith('vtp_') && !['vtp_mode', 'vtp_isAutoCollectPiiEnabledFlag'].includes(key)) fields[stripVtp(key)] = ctx.render(value);
            }
            return { ...base, mode: m.vtp_mode, fields };
        }
        default: {
            const settings = {};
            for (const [key, value] of Object.entries(m)) {
                if (key.startsWith('vtp_')) settings[stripVtp(key)] = ctx.render(value, stripVtp(key), where);
            }
            return Object.keys(settings).length ? { ...base, settings } : base;
        }
    }
}

function dedupeSecrets(secrets) {
    return [...new Map(secrets.map(s => [`${s.where}|${s.kind}`, s])).values()];
}

function maskPii(value) {
    if (typeof value === 'string') {
        return value
            .replace(EMAIL, (m) => (/@example\.(com|org)$/i.test(m) ? m : '[email redacted]'))
            .replace(PHONE, '[phone redacted]');
    }
    if (Array.isArray(value)) return value.map(maskPii);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskPii(v)]));
    return value;
}

export async function getLiveContainer(containerId, options = {}) {
    const { id, data } = await fetchLiveContainer(containerId);
    return digestContainerData(id, data, options);
}

export function digestContainerData(id, data, { platform, includeParameters = false } = {}) {
    const normalizedPlatform = platform ? normalizePlatform(platform) : undefined;
    const ctx = createContext(id, data);
    const digest = digestLiveContainer(ctx, { platform: normalizedPlatform, includeParameters });
    if (normalizedPlatform && digest.tagCount === 0) {
        throw new Error(`No "${normalizedPlatform}" tags in ${id}. Platforms in this container: ${digest.platforms.join(', ') || 'none'}`);
    }
    return maskPii(digest);
}

/** Which pixel/measurement IDs seen by the scan do not appear anywhere in the fetched containers. */
export async function crossCheckScanIds(containerIds, scanPixels) {
    const raws = [];
    for (const id of containerIds) {
        try {
            raws.push((await fetchLiveContainer(id)).raw);
        } catch {
            // Unfetchable containers are reported separately by the caller.
        }
    }
    const haystack = raws.join('\n');
    const missing = {};
    for (const [pixel, ids] of Object.entries(scanPixels || {})) {
        if (!Array.isArray(ids)) continue;
        const notFound = ids.filter(id => !haystack.includes(String(id).replace(/^AW-/, '')));
        if (notFound.length) missing[pixel] = notFound;
    }
    return missing;
}
