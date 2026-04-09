(function () {
    const LC = window.LottieCompiler || (window.LottieCompiler = {});

    LC.shared = {
        ELLIPSE_KAPPA: 0.5522847498307936,
        clamp(value, min, max) {
            return Math.min(max, Math.max(min, value));
        },
        cloneValue(value) {
            if (Array.isArray(value)) return value.map(LC.shared.cloneValue);
            if (value && typeof value === 'object') return JSON.parse(JSON.stringify(value));
            return value;
        },
        isBezierPath(value) {
            return value && typeof value === 'object' && Array.isArray(value.i) && Array.isArray(value.o) && Array.isArray(value.v);
        },
        unwrapPropertyValue(value) {
            if (Array.isArray(value) && value.length === 1 && LC.shared.isBezierPath(value[0])) {
                return value[0];
            }
            return value;
        }
    };
})();
