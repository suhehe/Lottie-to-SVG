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

function cloneAnimationData(data) {
    return JSON.parse(JSON.stringify(data));
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    state.currentJsonFileSize = file.size || 0;

    const reader = new FileReader();
    reader.onload = async loadEvent => {
        try {
            const sourceData = JSON.parse(loadEvent.target.result);
            document.getElementById('jsonOutput').value = loadEvent.target.result;
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
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('clearBtn').addEventListener('click', () => clearWorkspace());
    document.getElementById('jsonPreviewBtn').addEventListener('click', () => setJsonPanelView('preview'));
    document.getElementById('jsonCodeBtn').addEventListener('click', () => setJsonPanelView('code'));
    document.getElementById('svgCompressionToggle').addEventListener('click', toggleSvgCompression);
    document.getElementById('svgPreviewBtn').addEventListener('click', () => setSvgPanelView('preview'));
    document.getElementById('svgCodeBtn').addEventListener('click', () => setSvgPanelView('code'));
    document.getElementById('downloadBtn').addEventListener('click', downloadSVG);
}

function initApp() {
    bindUIEvents();
    setLoadedState(true);
    clearWorkspace('等待上传 JSON 文件');
}

initApp();
