(function () {
    const LC = window.LottieCompiler || (window.LottieCompiler = {});
    const state = LC.state;
    const EMPTY_JSON_PREVIEW_HTML = LC.EMPTY_JSON_PREVIEW_HTML;
    const EMPTY_SVG_PREVIEW_HTML = LC.EMPTY_SVG_PREVIEW_HTML;
    const { createEmptyFeatureReport, resetFeatureReport } = LC.featureAnalysis;

    function setLoadedState(isLoaded) {
        const shell = document.getElementById('appShell');
        if (!shell) return;
        shell.classList.toggle('is-loaded', Boolean(isLoaded));
    }

    function setPanelView(options) {
        const { panelSelector, previewViewId, codeViewId, previewBtnId, codeBtnId, codeMode } = options;
        const isCode = codeMode === true;
        const panel = document.querySelector(panelSelector);
        const previewView = document.getElementById(previewViewId);
        const codeView = document.getElementById(codeViewId);
        const previewBtn = document.getElementById(previewBtnId);
        const codeBtn = document.getElementById(codeBtnId);

        if (panel) panel.dataset.view = isCode ? 'code' : 'preview';

        if (previewView) {
            previewView.classList.toggle('is-active', !isCode);
            previewView.hidden = isCode;
            previewView.style.display = isCode ? 'none' : 'flex';
            previewView.setAttribute('aria-hidden', String(isCode));
        }
        if (codeView) {
            codeView.classList.toggle('is-active', isCode);
            codeView.hidden = !isCode;
            codeView.style.display = isCode ? 'flex' : 'none';
            codeView.setAttribute('aria-hidden', String(!isCode));
        }
        if (previewBtn) previewBtn.classList.toggle('is-active', !isCode);
        if (codeBtn) codeBtn.classList.toggle('is-active', isCode);
    }

    function setJsonPanelView(view) {
        setPanelView({
            panelSelector: '.panel-lottie',
            previewViewId: 'jsonPreviewView',
            codeViewId: 'jsonCodeView',
            previewBtnId: 'jsonPreviewBtn',
            codeBtnId: 'jsonCodeBtn',
            codeMode: view === 'code'
        });
    }

    function setSvgPanelView(view) {
        setPanelView({
            panelSelector: '.panel-svg',
            previewViewId: 'svgPreviewView',
            codeViewId: 'svgCodeView',
            previewBtnId: 'svgPreviewBtn',
            codeBtnId: 'svgCodeBtn',
            codeMode: view === 'code'
        });
    }

    function getActiveSvgOutput() {
        const resolvedVariant = state.preferCompressedSvg && state.currentCompressedSvgOutput ? 'compressed' : 'raw';
        state.currentSvgVariant = resolvedVariant;
        return resolvedVariant === 'compressed' && state.currentCompressedSvgOutput
            ? state.currentCompressedSvgOutput
            : state.currentRawSvgOutput;
    }

    function setSvgCompression(enabled) {
        state.preferCompressedSvg = Boolean(enabled);
        state.currentSvgVariant = state.preferCompressedSvg && state.currentCompressedSvgOutput ? 'compressed' : 'raw';
        renderActiveSvgOutput();
        updateSvgVariantControls();
    }

    function toggleSvgCompression() {
        setSvgCompression(!state.preferCompressedSvg);
    }

    function renderActiveSvgOutput() {
        const activeSvg = getActiveSvgOutput();
        const activeSize = getByteSize(activeSvg);
        document.getElementById('output').value = activeSvg;
        document.getElementById('preview').innerHTML = activeSvg || EMPTY_SVG_PREVIEW_HTML;
        document.getElementById('downloadBtn').textContent = '导出';
        updateFileSizeLabel('svgSizeLabel', activeSize);
    }

    function updateSvgVariantControls() {
        const toggle = document.getElementById('svgCompressionToggle');
        const hasCompressed = !!state.currentCompressedSvgOutput;
        if (toggle) {
            toggle.disabled = !state.currentRawSvgOutput;
            toggle.setAttribute('aria-checked', String(state.preferCompressedSvg));
            toggle.title = hasCompressed
                ? (state.preferCompressedSvg ? '当前显示压缩版 SVG' : '当前显示原始版 SVG')
                : '当前素材暂无更小的压缩版，显示原始 SVG';
        }
    }

    function renderLottiePreview(data) {
        const container = document.getElementById('lottiePreview');
        if (state.currentLottieInstance) {
            state.currentLottieInstance.destroy();
            state.currentLottieInstance = null;
        }

        if (!window.lottie) {
            container.innerHTML = '<div class="empty-state">Lottie 播放器加载失败，无法预览原始动画。</div>';
            updateStatus('Lottie 播放器加载失败');
            return;
        }

        container.innerHTML = '';
        state.currentLottieInstance = window.lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: data,
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet',
                progressiveLoad: true
            }
        });
    }

    function destroyLottiePreview() {
        if (state.currentLottieInstance) {
            state.currentLottieInstance.destroy();
            state.currentLottieInstance = null;
        }
    }

    function updateMeta(data) {
        document.getElementById('metaSize').textContent = `${data.w || 0} × ${data.h || 0}`;
        document.getElementById('metaFps').textContent = `${data.fr || 0} fps`;
        document.getElementById('metaLayers').textContent = `${Array.isArray(data.layers) ? data.layers.length : 0}`;
    }

    function updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }

    function getByteSize(text) {
        return new TextEncoder().encode(text || '').length;
    }

    function formatFileSize(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(/\.0$/, '')} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2).replace(/\.?0+$/, '')} MB`;
    }

    function updateFileSizeLabel(elementId, bytes) {
        const target = document.getElementById(elementId);
        if (target) target.textContent = formatFileSize(bytes);
    }

    function toggleClearButton(visible) {
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) clearBtn.style.display = visible ? 'inline-flex' : 'none';
    }

    function downloadSVG() {
        const svgContent = getActiveSvgOutput();
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = state.currentSvgVariant === 'compressed' ? 'compiled-animation.min.svg' : 'compiled-animation.svg';
        anchor.click();
    }

    function clearWorkspace(statusMessage = '已清空当前数据，请重新上传 JSON 文件') {
        destroyLottiePreview();
        state.currentJsonFileSize = 0;
        state.globalFeatureReport = createEmptyFeatureReport();
        state.currentRawSvgOutput = '';
        state.currentCompressedSvgOutput = '';
        state.preferCompressedSvg = true;
        state.currentSvgVariant = 'raw';

        document.getElementById('fileInput').value = '';
        document.getElementById('jsonOutput').value = '';
        document.getElementById('output').value = '';
        document.getElementById('lottiePreview').innerHTML = EMPTY_JSON_PREVIEW_HTML;
        document.getElementById('preview').innerHTML = EMPTY_SVG_PREVIEW_HTML;
        document.getElementById('downloadBtn').style.display = 'none';

        updateFileSizeLabel('jsonSizeLabel', 0);
        updateFileSizeLabel('svgSizeLabel', 0);
        document.getElementById('metaSize').textContent = '-';
        document.getElementById('metaFps').textContent = '-';
        document.getElementById('metaLayers').textContent = '-';
        resetFeatureReport();
        setJsonPanelView('preview');
        setSvgPanelView('preview');
        updateSvgVariantControls();
        toggleClearButton(false);
        updateStatus(statusMessage);
    }

    LC.ui = {
        setLoadedState,
        setPanelView,
        setJsonPanelView,
        setSvgPanelView,
        getActiveSvgOutput,
        setSvgCompression,
        toggleSvgCompression,
        renderActiveSvgOutput,
        updateSvgVariantControls,
        renderLottiePreview,
        destroyLottiePreview,
        updateMeta,
        updateStatus,
        getByteSize,
        formatFileSize,
        updateFileSizeLabel,
        toggleClearButton,
        downloadSVG,
        clearWorkspace
    };
})();
