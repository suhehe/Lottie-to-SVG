import { state } from './state.js';
import { analyzeLottieFeatures, renderFeatureReport } from './feature-analysis.js';
import {
    clearWorkspace,
    downloadSVG,
    renderLottiePreview,
    setJsonPanelView,
    setLoadedState,
    setSvgPanelView,
    toggleClearButton,
    toggleSvgCompression,
    updateFileSizeLabel,
    updateStatus
} from './ui.js';
import { compileLottie } from './compiler.js';

let hasBoundUIEvents = false;

function cloneAnimationData(data) {
    return JSON.parse(JSON.stringify(data));
}

async function handleFileSelect(event) {
    const file = event && event.target ? event.target.files[0] : null;
    if (!file) return;

    state.currentJsonFileSize = file.size || 0;

    const reader = new FileReader();
    reader.onload = async loadEvent => {
        try {
            const rawJson = loadEvent.target && typeof loadEvent.target.result === 'string'
                ? loadEvent.target.result
                : '';
            const sourceData = JSON.parse(rawJson);
            document.getElementById('jsonOutput').value = rawJson;
            updateFileSizeLabel('jsonSizeLabel', state.currentJsonFileSize);
            state.globalFeatureReport = analyzeLottieFeatures(sourceData);
            renderFeatureReport(state.globalFeatureReport);

            const previewData = cloneAnimationData(sourceData);
            const compileData = cloneAnimationData(sourceData);
            renderLottiePreview(previewData);
            await compileLottie(compileData, file.name);

            setLoadedState(true);
            setJsonPanelView('preview');
            setSvgPanelView('preview');
            toggleClearButton(true);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Invalid JSON file. Please upload a valid Lottie JSON.');
            updateStatus('JSON 解析失败，请检查文件格式');
        }
    };

    reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        alert('Failed to read the file. Please try again.');
        updateStatus('文件读取失败，请重试');
    };

    reader.readAsText(file);
}

function bindUIEvents() {
    if (hasBoundUIEvents) return;
    hasBoundUIEvents = true;

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const clearBtn = document.getElementById('clearBtn');
    const jsonPreviewBtn = document.getElementById('jsonPreviewBtn');
    const jsonCodeBtn = document.getElementById('jsonCodeBtn');
    const svgCompressionToggle = document.getElementById('svgCompressionToggle');
    const svgPreviewBtn = document.getElementById('svgPreviewBtn');
    const svgCodeBtn = document.getElementById('svgCodeBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => clearWorkspace());
    }
    if (jsonPreviewBtn) {
        jsonPreviewBtn.addEventListener('click', () => setJsonPanelView('preview'));
    }
    if (jsonCodeBtn) {
        jsonCodeBtn.addEventListener('click', () => setJsonPanelView('code'));
    }
    if (svgCompressionToggle) {
        svgCompressionToggle.addEventListener('click', toggleSvgCompression);
    }
    if (svgPreviewBtn) {
        svgPreviewBtn.addEventListener('click', () => setSvgPanelView('preview'));
    }
    if (svgCodeBtn) {
        svgCodeBtn.addEventListener('click', () => setSvgPanelView('code'));
    }
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadSVG);
    }
}

function initApp() {
    bindUIEvents();
    setLoadedState(true);
    clearWorkspace('等待上传 JSON 文件');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
    initApp();
}
