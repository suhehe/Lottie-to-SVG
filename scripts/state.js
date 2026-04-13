export const state = {
    globalAssets: {},
    globalFPS: 30,
    globalDuration: 0,
    globalFrameStart: 0,
    globalFrameCount: 1,
    globalSampleFrames: [0, 1],
    globalKeyTimes: '0;1',
    globalKeyTimeValues: ['0', '1'],
    globalKeyTimeNumbers: [0, 1],
    defsHTML: '',
    globalGradientCache: new Map(),
    idCounter: 0,
    currentLottieInstance: null,
    globalFeatureReport: {
        supported: new Map(),
        unsupported: new Map()
    },
    currentJsonFileSize: 0,
    currentRawSvgOutput: '',
    currentCompressedSvgOutput: '',
    currentSvgVariant: 'raw',
    preferCompressedSvg: true
};

export const EMPTY_JSON_PREVIEW_HTML = '<div class="empty-state">上传一个 Lottie JSON 后，这里会播放原始动画，方便和 SVG 结果对照。</div>';
export const EMPTY_SVG_PREVIEW_HTML = '<div class="empty-state">上传一个 Lottie JSON 后，这里会显示编译后的 SVG 预览。</div>';

export function getUID(prefix) {
    return `${prefix}_${state.idCounter++}`;
}
