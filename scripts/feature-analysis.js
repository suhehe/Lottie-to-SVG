import { state } from './state.js';
import { unwrapPropertyValue } from './shared.js';

export function createEmptyFeatureReport() {
    return {
        supported: new Map(),
        unsupported: new Map()
    };
}

export function analyzeLottieFeatures(data) {
    const report = createEmptyFeatureReport();
    const visitedComps = new Set();

    function addFeature(map, name, note = '') {
        const existing = map.get(name) || { count: 0, notes: new Set() };
        existing.count += 1;
        if (note) existing.notes.add(note);
        map.set(name, existing);
    }

    function mark(name, supported, note = '') {
        addFeature(supported ? report.supported : report.unsupported, name, note);
    }

    function scanPropertyFeature(prop, name) {
        if (prop && prop.a === 1) {
            mark(name, true);
            if (hasTerminalMarkerKeyframe(prop)) {
                mark('结束标记关键帧', true, name);
            }
        }
    }

    function hasTerminalMarkerKeyframe(prop) {
        if (!prop || prop.a !== 1 || !Array.isArray(prop.k) || prop.k.length < 2) return false;
        const last = prop.k[prop.k.length - 1];
        return !!(last && last.t != null && last.s == null && last.e == null);
    }

    function scanShapeItems(items) {
        (items || []).forEach(item => {
            if (!item || item.hd) return;

            switch (item.ty) {
                case 'gr':
                    mark('形状分组', true);
                    scanShapeItems(item.it || []);
                    break;
                case 'sh':
                    mark('贝塞尔路径', true);
                    if (item.ks && item.ks.a === 1) {
                        const pathStates = [];
                        (item.ks.k || []).forEach(kf => {
                            const start = unwrapPropertyValue(kf.s);
                            const end = unwrapPropertyValue(kf.e);
                            if (start && start.v) pathStates.push(start);
                            if (end && end.v) pathStates.push(end);
                        });
                        const vertexCounts = new Set(pathStates.map(shapeState => shapeState.v.length));
                        mark('路径形变', vertexCounts.size <= 1, vertexCounts.size <= 1 ? '' : '锚点数量变化');
                        if (hasTerminalMarkerKeyframe(item.ks)) {
                            mark('结束标记关键帧', true, '路径形变');
                        }
                    }
                    break;
                case 'rc':
                    mark('矩形', true);
                    break;
                case 'el':
                    mark('椭圆', true);
                    break;
                case 'sr':
                    mark('星形/多边形', true);
                    break;
                case 'fl':
                    mark('纯色填充', true);
                    break;
                case 'st':
                    mark('纯色描边', true);
                    break;
                case 'gf':
                    mark(item.t === 1 ? '线性渐变填充' : '径向渐变填充', item.t === 1, item.t === 1 ? '' : '当前仅输出 linearGradient');
                    break;
                case 'gs':
                    mark(item.t === 1 ? '线性渐变描边' : '径向渐变描边', item.t === 1, item.t === 1 ? '' : '当前仅输出 linearGradient');
                    break;
                case 'tm':
                    mark('Trim Paths', false);
                    break;
                case 'rp':
                    mark('Repeater', false);
                    break;
                case 'mm':
                    mark('Merge Paths', false);
                    break;
                case 'rd':
                    mark('Rounded Corners', false);
                    break;
                case 'pb':
                    mark('Pucker & Bloat', false);
                    break;
                case 'zz':
                    mark('Zig Zag', false);
                    break;
                case 'op':
                    mark('Offset Paths', false);
                    break;
                case 'tw':
                    mark('Twist', false);
                    break;
                case 'tr':
                    mark('局部 Transform', true);
                    scanPropertyFeature(item.sk, 'Skew');
                    break;
                default:
                    mark(`未知形状特性: ${item.ty}`, false);
                    break;
            }
        });
    }

    function scanLayer(layer) {
        if (!layer || layer.hd) return;

        const typeMap = {
            0: ['预合成图层', true],
            1: ['纯色图层', true],
            2: ['图片图层', true],
            3: ['Null 图层', true],
            4: ['形状图层', true],
            5: ['文本图层', false],
            13: ['相机图层', false]
        };
        const [typeName, typeSupported] = typeMap[layer.ty] || [`未知图层类型: ${layer.ty}`, false];
        mark(typeName, typeSupported);

        if (layer.parent != null) mark('父子矩阵继承', true);
        if (layer.tt != null) mark(layer.tt === 3 || layer.tt === 4 ? '反向 Track Matte' : 'Track Matte', layer.tt === 1 || layer.tt === 2, layer.tt === 3 || layer.tt === 4 ? '当前未处理反向 matte' : '');
        if (Array.isArray(layer.masksProperties) && layer.masksProperties.length) mark('图层 Masks', false);
        if (layer.tm != null) mark('Time Remap', false);
        if (layer.bm && layer.bm !== 0) mark('混合模式', false);

        scanPropertyFeature(layer.ks && layer.ks.p, '位置动画');
        scanPropertyFeature(layer.ks && layer.ks.s, '缩放动画');
        scanPropertyFeature(layer.ks && (layer.ks.r || layer.ks.rz), '旋转动画');
        scanPropertyFeature(layer.ks && layer.ks.o, '透明度动画');
        scanPropertyFeature(layer.ks && layer.ks.sk, 'Skew');

        if (layer.ty === 4) scanShapeItems(layer.shapes || []);

        if (layer.ty === 0 && layer.refId && state.globalAssets[layer.refId] && !visitedComps.has(layer.refId)) {
            visitedComps.add(layer.refId);
            scanComposition(state.globalAssets[layer.refId]);
        }
    }

    function scanComposition(compData) {
        (compData.layers || []).forEach(scanLayer);
    }

    state.globalAssets = {};
    (data.assets || []).forEach(asset => {
        state.globalAssets[asset.id] = asset;
    });
    scanComposition(data);
    return report;
}

export function renderFeatureReport(report) {
    renderFeatureList('supportedFeatures', report.supported, '当前素材里还没有命中已支持的解析特性。');
    renderFeatureList('unsupportedFeatures', report.unsupported, '当前素材里没有检测到未支持特性。');
}

export function renderFeatureList(elementId, featureMap, emptyText) {
    const container = document.getElementById(elementId);
    const entries = Array.from(featureMap.entries()).sort((left, right) => left[0].localeCompare(right[0], 'zh-CN'));

    if (!entries.length) {
        container.innerHTML = `<li class="feature-empty">${emptyText}</li>`;
        return;
    }

    container.innerHTML = entries.map(([name, meta]) => {
        const notes = Array.from(meta.notes || []).filter(Boolean);
        const suffix = meta.count > 1 ? ` ×${meta.count}` : '';
        const noteText = notes.length ? ` (${notes.join(' / ')})` : '';
        return `<li title="${name}${noteText}">${name}${suffix}${noteText}</li>`;
    }).join('');
}

export function resetFeatureReport() {
    renderFeatureList('supportedFeatures', new Map(), '上传后会显示当前素材中已命中的可解析特性。');
    renderFeatureList('unsupportedFeatures', new Map(), '如果素材里出现当前解析器未覆盖的特性，这里会列出来。');
}
