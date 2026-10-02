import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

function isPrivateIPv4(ip) {
    const [a, b] = ip.split('.').map(Number);
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
    );
}

function isPrivateIP(ip) {
    if (isIP(ip) === 4) return isPrivateIPv4(ip);

    const lower = ip.toLowerCase();
    if (lower.startsWith('::ffff:')) return isPrivateIPv4(lower.slice(7));
    return (
        lower === '::' ||
        lower === '::1' ||
        lower.startsWith('fc') ||
        lower.startsWith('fd') ||
        lower.startsWith('fe80')
    );
}

/**
 * Throws unless the URL is a public http(s) address.
 */
export async function assertPublicUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('Invalid URL. Use a full address like https://example.com');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http and https URLs can be scanned');
    }

    const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
        throw new Error('Internal hostnames cannot be scanned');
    }

    const addresses = isIP(hostname)
        ? [{ address: hostname }]
        : await lookup(hostname, { all: true }).catch(() => {
            throw new Error(`Could not resolve hostname: ${hostname}`);
        });

    if (addresses.some(({ address }) => isPrivateIP(address))) {
        throw new Error('Private or internal network addresses cannot be scanned');
    }

    return parsed.toString();
}
