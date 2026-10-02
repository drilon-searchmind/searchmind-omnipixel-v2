import { readFileSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data', 'reference-setups');

export const BUILT_IN_TYPES = {
    gaawe: 'GA4 Event',
    googtag: 'Google Tag',
    baut: 'Microsoft Advertising UET',
    pntr: 'Pinterest Tag',
    awct: 'Google Ads Conversion Tracking',
    sp: 'Google Ads Remarketing',
    gclidw: 'Conversion Linker',
    html: 'Custom HTML',
    sgtmgaaw: 'GA4 (server)',
    sgtmadsct: 'Google Ads Conversion Tracking (server)',
    sgtmadscl: 'Conversion Linker (server)',
    sgtmadsremarket: 'Google Ads Remarketing (server)',
    gaaw_client: 'GA4 client',
    c: 'Constant',
    v: 'Data Layer Variable',
    k: '1st-Party Cookie',
    ed: 'Event Data',
    jsm: 'Custom JavaScript',
    u: 'URL',
    awec: 'User-Provided Data',
    gtes: 'Google Tag: Event Settings',
    gtcs: 'Google Tag: Configuration Settings',
};

const BUILT_IN_TRIGGERS = {
    '2147479553': 'All Pages',
    '2147479572': 'Initialization - All Pages',
    '2147479573': 'Consent Initialization - All Pages',
};

const BUILT_IN_TRIGGER_EVENTS = {
    '2147479553': 'gtm.js',
    '2147479572': 'gtm.init',
    '2147479573': 'gtm.init_consent',
};

// The dataLayer event each GTM trigger type listens to. Live gtm.js only exposes these event names, not trigger names.
export const TRIGGER_TYPE_EVENTS = {
    PAGEVIEW: 'gtm.js',
    DOM_READY: 'gtm.dom',
    WINDOW_LOADED: 'gtm.load',
    INIT: 'gtm.init',
    CONSENT_INIT: 'gtm.init_consent',
    CLICK: 'gtm.click',
    LINK_CLICK: 'gtm.linkClick',
    FORM_SUBMISSION: 'gtm.formSubmit',
    HISTORY_CHANGE: 'gtm.historyChange',
    TIMER: 'gtm.timer',
    SCROLL_DEPTH: 'gtm.scrollDepth',
    ELEMENT_VISIBILITY: 'gtm.elementVisibility',
    YOU_TUBE_VIDEO: 'gtm.video',
    JS_ERROR: 'gtm.pageError',
};

const PLATFORM_ALIASES = {
    linkedin: 'linkedin',
    snap: 'snapchat',
    mads: 'microsoft_ads',
    bing: 'microsoft_ads',
    gads: 'google_ads',
    adwords: 'google_ads',
    ga: 'ga4',
    facebook: 'meta',
    fb: 'meta',
    data_tags: 'data_tag',
    stape: 'data_tag',
    auxiliary: 'consent',
};

let manifestCache = null;
const containerCache = new Map();

export function listSetups() {
    manifestCache ??= JSON.parse(readFileSync(path.join(DATA_DIR, 'index.json'), 'utf8'));
    return manifestCache;
}

function getSetup(setupId) {
    const setup = listSetups().find(s => s.id === setupId);
    if (!setup) {
        throw new Error(`Unknown setupId "${setupId}". Available: ${listSetups().map(s => s.id).join(', ')}`);
    }
    return setup;
}

function loadContainer(setupId, kind) {
    const setup = getSetup(setupId);
    const file = setup.containers[kind];
    if (!file) throw new Error(`Setup "${setupId}" has no ${kind} container`);

    const key = `${setupId}/${kind}`;
    if (!containerCache.has(key)) {
        const cv = JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8')).containerVersion;
        containerCache.set(key, indexContainer(cv));
    }
    return containerCache.get(key);
}

const simplify = (p) => p.value !== undefined ? p.value
    : p.list ? p.list.map(simplify)
    : p.map ? Object.fromEntries(p.map.map(m => [m.key, simplify(m)]))
    : null;

const paramsOf = (item) => Object.fromEntries((item.parameter || []).map(p => [p.key, simplify(p)]));

export function normalizePlatform(folderName) {
    const key = (folderName || 'other').replace(/^\[[^\]]+\]\s*/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return PLATFORM_ALIASES[key] || key;
}

function indexContainer(cv) {
    const templateNames = {};
    for (const t of cv.customTemplate || []) {
        const galleryId = t.galleryReference?.galleryTemplateId;
        templateNames[galleryId ? `cvt_${galleryId}` : `cvt_${cv.containerId}_${t.templateId}`] = t.name;
    }
    const typeLabel = (type) => templateNames[type] || BUILT_IN_TYPES[type] || type;
    const folders = Object.fromEntries((cv.folder || []).map(f => [f.folderId, f.name]));
    const triggersById = Object.fromEntries((cv.trigger || []).map(t => [t.triggerId, t]));
    const triggerName = (id) => triggersById[id]?.name || BUILT_IN_TRIGGERS[id] || `trigger ${id}`;

    return {
        name: cv.container?.name,
        usage: cv.container?.usageContext?.[0]?.toLowerCase(),
        cv,
        typeLabel,
        folders,
        triggersById,
        triggerName,
        templates: (cv.customTemplate || []).map(t => ({
            name: t.name,
            source: t.galleryReference ? `${t.galleryReference.owner}/${t.galleryReference.repository}` : 'custom',
        })),
    };
}

const describeCondition = (c) => {
    const p = paramsOf(c);
    return `${p.arg0} ${c.type.toLowerCase().replace(/_/g, ' ')} "${p.arg1}"`;
};

function describeTrigger(trigger, ctx) {
    if (trigger.type === 'TRIGGER_GROUP') {
        const ids = paramsOf(trigger).triggerIds || [];
        return `fires once all of these have fired: ${ids.map(ctx.triggerName).join(' + ')}`;
    }
    const parts = [];
    if (trigger.customEventFilter?.length) parts.push(`event: ${trigger.customEventFilter.map(describeCondition).join(' and ')}`);
    if (trigger.filter?.length) parts.push(`when ${trigger.filter.map(describeCondition).join(' and ')}`);
    return `${trigger.type}${parts.length ? ` (${parts.join('; ')})` : ''}`;
}

function triggerEvents(id, ctx, seen = new Set()) {
    if (BUILT_IN_TRIGGER_EVENTS[id]) return BUILT_IN_TRIGGER_EVENTS[id];
    const trigger = ctx.triggersById[id];
    if (!trigger || seen.has(id)) return ctx.triggerName(id);
    seen.add(id);

    if (trigger.type === 'TRIGGER_GROUP') {
        return (paramsOf(trigger).triggerIds || []).map(t => triggerEvents(t, ctx, seen)).sort().join(' + ');
    }
    const eventFilter = [...(trigger.customEventFilter || []), ...(trigger.filter || [])]
        .map(paramsOf)
        .find(p => /^\{\{(_event|Event|Event Name)\}\}$/.test(p.arg0));
    if (eventFilter) return eventFilter.arg1;
    return TRIGGER_TYPE_EVENTS[trigger.type] || ctx.triggerName(id);
}

function describeConsent(tag) {
    const cs = tag.consentSettings;
    // Same wording as live-container: gtm.js cannot tell "not set" from "not needed", both are "none".
    if (!cs || cs.consentStatus === 'NOT_SET') {
        const serverConsent = paramsOf(tag).adStorageConsent;
        return serverConsent ? `server-side ad_storage consent: ${serverConsent}` : 'none';
    }
    if (cs.consentStatus === 'NOT_NEEDED') return 'none';
    const types = (cs.consentType?.list || []).map(t => t.value);
    return `requires ${types.join(', ')}`;
}

function eventOf(tag, params) {
    if (tag.type === 'googtag') return 'config';
    if (tag.type === 'gclidw') return 'conversion_linker';
    const named = params.eventNameStandard || params.event_name_standard || params.eventName;
    const event = named && named !== 'standard'
        ? named
        : params.event_type || params.eventType || params.type || params.event || null;
    if (event && !/^\{\{/.test(event) && !/^(CUSTOM|conversion|event)$/i.test(event)) return event;
    return tag.name.split(' - ').slice(1).join(' - ') || event;
}

const referencedVariables = (value) => [...(JSON.stringify(value) ?? '').matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]);

function digestTag(tag, ctx, includeParameters) {
    const params = paramsOf(tag);
    const digest = {
        name: tag.name,
        platform: normalizePlatform(ctx.folders[tag.parentFolderId]),
        type: ctx.typeLabel(tag.type),
        event: eventOf(tag, params),
        firesOn: (tag.firingTriggerId || []).map(ctx.triggerName),
        firesOnEvents: (tag.firingTriggerId || []).map(id => triggerEvents(id, ctx)),
        consent: describeConsent(tag),
    };
    if (tag.blockingTriggerId?.length) digest.blockedBy = tag.blockingTriggerId.map(ctx.triggerName);
    if (tag.paused) digest.paused = true;
    if (includeParameters) digest.parameters = params;
    return digest;
}

function digestVariable(variable, ctx) {
    const params = paramsOf(variable);
    const source = params.name ?? params.keyPath ?? params.value ?? null;
    return {
        name: variable.name,
        type: ctx.typeLabel(variable.type),
        ...(source !== null && typeof source !== 'object' ? { source } : {}),
    };
}

export function buildEventMatrix(tags) {
    const matrix = {};
    for (const tag of tags) {
        if (tag.paused) continue;
        for (const event of tag.firesOnEvents) {
            (matrix[event] ||= []).push(`${tag.platform}${tag.event ? `: ${tag.event}` : ''}`);
        }
    }
    return matrix;
}

export function galleryTemplateNames() {
    const names = {};
    for (const setup of listSetups()) {
        for (const kind of Object.keys(setup.containers)) {
            for (const t of loadContainer(setup.id, kind).cv.customTemplate || []) {
                const galleryId = t.galleryReference?.galleryTemplateId;
                if (galleryId) names[`cvt_${galleryId}`] = t.name;
            }
        }
    }
    return names;
}

function digestContainer(ctx, { platform, includeParameters }) {
    const { cv } = ctx;
    const allTags = (cv.tag || []).map(t => digestTag(t, ctx, includeParameters));
    const tags = platform ? allTags.filter(t => t.platform === platform) : allTags;

    const usedTriggerNames = new Set(tags.flatMap(t => [...t.firesOn, ...(t.blockedBy || [])]));
    for (const trigger of cv.trigger || []) {
        if (usedTriggerNames.has(trigger.name) && trigger.type === 'TRIGGER_GROUP') {
            (paramsOf(trigger).triggerIds || []).forEach(id => usedTriggerNames.add(ctx.triggerName(id)));
        }
    }
    const triggers = (cv.trigger || [])
        .filter(t => !platform || usedTriggerNames.has(t.name))
        .map(t => ({ name: t.name, condition: describeTrigger(t, ctx) }));

    let variables = cv.variable || [];
    if (platform) {
        const rawTags = (cv.tag || []).filter(t => normalizePlatform(ctx.folders[t.parentFolderId]) === platform);
        const used = new Set(rawTags.flatMap(t => referencedVariables(t.parameter)));
        for (const v of variables.filter(v => used.has(v.name))) referencedVariables(v.parameter).forEach(n => used.add(n));
        variables = variables.filter(v => used.has(v.name));
    }

    const platforms = [...new Set(allTags.map(t => t.platform))];
    const result = {
        container: ctx.name,
        usage: ctx.usage,
        platforms,
        tagCount: tags.length,
        eventMatrix: buildEventMatrix(tags),
        tags,
        triggers,
        variables: variables.map(v => digestVariable(v, ctx)),
    };

    if (!platform) {
        result.templates = ctx.templates;
        if (cv.client?.length) {
            result.clients = cv.client.map(c => ({ name: c.name, type: ctx.typeLabel(c.type), settings: paramsOf(c) }));
        }
        if (cv.transformation?.length) {
            result.transformations = cv.transformation.map(t => ({ name: t.name, type: t.type, settings: paramsOf(t) }));
        }
    }
    return result;
}

export function getSetupOverview() {
    return listSetups().map(setup => ({
        id: setup.id,
        name: setup.name,
        description: setup.description,
        useWhen: setup.useWhen,
        rulesetPrefix: setup.rulesetPrefix,
        containers: Object.fromEntries(Object.keys(setup.containers).map(kind => {
            const ctx = loadContainer(setup.id, kind);
            const tags = (ctx.cv.tag || []).map(t => normalizePlatform(ctx.folders[t.parentFolderId]));
            return [kind, { name: ctx.name, tags: tags.length, platforms: [...new Set(tags)] }];
        })),
    }));
}

export function getSetupDetails(setupId, { container, platform, includeParameters = false } = {}) {
    const setup = getSetup(setupId);
    const kinds = container ? [container] : Object.keys(setup.containers);
    const normalizedPlatform = platform ? normalizePlatform(platform) : undefined;

    const containers = {};
    for (const kind of kinds) {
        const digest = digestContainer(loadContainer(setupId, kind), { platform: normalizedPlatform, includeParameters });
        if (!normalizedPlatform || digest.tagCount > 0) containers[kind] = digest;
    }
    if (normalizedPlatform && Object.keys(containers).length === 0) {
        const available = getSetupOverview().find(s => s.id === setupId).containers;
        throw new Error(`No "${normalizedPlatform}" tags in ${setupId}. Platforms: ${JSON.stringify(Object.fromEntries(Object.entries(available).map(([k, v]) => [k, v.platforms])))}`);
    }

    return {
        id: setup.id,
        name: setup.name,
        description: setup.description,
        rulesetPrefix: setup.rulesetPrefix,
        ...(normalizedPlatform ? { platform: normalizedPlatform } : {}),
        containers,
    };
}
