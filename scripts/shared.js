export const ELLIPSE_KAPPA = 0.5522847498307936;

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') return JSON.parse(JSON.stringify(value));
    return value;
}

export function isBezierPath(value) {
    return value && typeof value === 'object' && Array.isArray(value.i) && Array.isArray(value.o) && Array.isArray(value.v);
}

export function unwrapPropertyValue(value) {
    if (Array.isArray(value) && value.length === 1 && isBezierPath(value[0])) {
        return value[0];
    }
    return value;
}
