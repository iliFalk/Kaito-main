let shortcutToolbar = null;

const ICONS = {
    DocumentTextIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`,
    LanguageIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>`,
    CheckCircleIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
    QuestionMarkCircleIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>`,
    PencilIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`,
    ChatBubbleLeftRightIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.534A9.003 9.003 0 0 1 12 15.75a9.003 9.003 0 0 1-4.057 1.082l-3.722-.534A2.002 2.002 0 0 1 2.25 15v-4.286c0-.97.616-1.813 1.5-2.097m16.5 0-.229-.08a2.002 2.002 0 0 0-2.053.228l-.934.934V5.625a2.25 2.25 0 0 0-2.25-2.25h-9a2.25 2.25 0 0 0-2.25 2.25v3.432l-.934-.934a2.002 2.002 0 0 0-2.053-.228l-.229.081m16.5 0c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.534A9.003 9.003 0 0 1 12 15.75a9.003 9.003 0 0 1-4.057 1.082l-3.722-.534A2.002 2.002 0 0 1 2.25 15v-4.286c0-.97.616-1.813 1.5-2.097" /></svg>`,
    EllipsisHorizontalIcon: `<svg class="icon" xmlns="/vendor/svg-b0568748" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>`,
};

function removeShortcutToolbar() {
    if (shortcutToolbar) {
        shortcutToolbar.remove();
        shortcutToolbar = null;
    }
}

async function showShortcutToolbar(range, text) {
    removeShortcutToolbar();

    shortcutToolbar = document.createElement('div');
    shortcutToolbar.id = 'ai-sidekick-shortcut-toolbar';
    document.body.appendChild(shortcutToolbar);

    try {
        const { shortcuts } = await chrome.runtime.sendMessage({ type: 'getShortcuts' });

        // "Quote" button
        const quoteButton = document.createElement('button');
        quoteButton.innerHTML = ICONS.ChatBubbleLeftRightIcon;
        quoteButton.dataset.tooltip = 'Quote Text';
        quoteButton.onclick = (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ type: 'executeShortcut', shortcut: { id: 'quote', title: 'Quote' }, selectedText: text });
            removeShortcutToolbar();
        };
        shortcutToolbar.appendChild(quoteButton);

        if (shortcuts && shortcuts.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'separator';
            shortcutToolbar.appendChild(separator);

            // Shortcut buttons
            shortcuts.slice(0, 4).forEach(shortcut => {
                const button = document.createElement('button');
                button.innerHTML = ICONS[shortcut.icon] || '';
                button.dataset.tooltip = shortcut.title;
                button.onclick = (e) => {
                    e.stopPropagation();
                    chrome.runtime.sendMessage({ type: 'executeShortcut', shortcut, selectedText: text });
                    removeShortcutToolbar();
                };
                shortcutToolbar.appendChild(button);
            });
        }
        
        // "More Actions" button for settings
        const moreButton = document.createElement('button');
        moreButton.innerHTML = ICONS.EllipsisHorizontalIcon;
        moreButton.dataset.tooltip = 'Manage Shortcuts...';
        moreButton.onclick = (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ type: 'executeShortcut', shortcut: { id: 'settings' }, selectedText: '' });
            removeShortcutToolbar();
        };
        shortcutToolbar.appendChild(moreButton);

        const rect = range.getBoundingClientRect();
        const toolbarRect = shortcutToolbar.getBoundingClientRect();

        let top = window.scrollY + rect.top - toolbarRect.height - 8;
        let left = window.scrollX + rect.left + (rect.width / 2) - (toolbarRect.width / 2);

        // Boundary checks
        if (top < window.scrollY + 10) {
            top = window.scrollY + rect.bottom + 8;
        }
        if (left < window.scrollX + 10) {
            left = window.scrollX + 10;
        }
        if (left + toolbarRect.width > window.scrollX + window.innerWidth - 10) {
            left = window.scrollX + window.innerWidth - toolbarRect.width - 10;
        }

        shortcutToolbar.style.top = `${top}px`;
        shortcutToolbar.style.left = `${left}px`;
        shortcutToolbar.style.opacity = '1';

    } catch (error) {
        console.error("AI Sidekick: Could not create shortcut toolbar.", error);
        removeShortcutToolbar();
    }
}

document.addEventListener('mouseup', (event) => {
    if (event.target.closest && event.target.closest('#ai-sidekick-shortcut-toolbar')) {
        return;
    }
    
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && selection.rangeCount > 0) {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
            removeShortcutToolbar();
            return;
        }
        const range = selection.getRangeAt(0);
        showShortcutToolbar(range, text);
    } else {
        removeShortcutToolbar();
    }
}, true);

document.addEventListener('mousedown', (event) => {
    if (shortcutToolbar && !shortcutToolbar.contains(event.target)) {
        removeShortcutToolbar();
    }
}, true);


// --- Screenshot Functionality ---

function initiateScreenshotSelection() {
    if (document.getElementById('ai-sidekick-screenshot-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ai-sidekick-screenshot-overlay';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'ai-sidekick-screenshot-canvas';
    
    const selectionBox = document.createElement('div');
    selectionBox.id = 'ai-sidekick-screenshot-selection';
    
    const instructions = document.createElement('div');
    instructions.id = 'ai-sidekick-screenshot-instructions';
    instructions.textContent = 'Click and drag to select an area, or press Esc to cancel';
    
    overlay.appendChild(canvas);
    overlay.appendChild(selectionBox);
    overlay.appendChild(instructions);
    document.body.appendChild(overlay);

    let streamRef = null;
    let isSelecting = false;
    let startPos = null;
    const dpr = window.devicePixelRatio || 1;

    const cleanup = () => {
        if (streamRef) {
            streamRef.getTracks().forEach(track => track.stop());
            streamRef = null;
        }
        document.removeEventListener('keydown', handleKeyDown);
        if (overlay.parentNode) {
          overlay.remove();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            cleanup();
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    const handleMouseDown = (e) => {
        e.preventDefault();
        isSelecting = true;
        startPos = { x: e.clientX, y: e.clientY };
        selectionBox.style.left = `${e.clientX}px`;
        selectionBox.style.top = `${e.clientY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || !startPos) return;
        e.preventDefault();
        const currentPos = { x: e.clientX, y: e.clientY };
        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(startPos.x - currentPos.x);
        const height = Math.abs(startPos.y - currentPos.y);
        selectionBox.style.left = `${x}px`;
        selectionBox.style.top = `${y}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
    };

    const handleMouseUp = (e) => {
        if (!isSelecting || !startPos) {
            isSelecting = false;
            return;
        }
        e.preventDefault();
        isSelecting = false;

        const endPos = { x: e.clientX, y: e.clientY };
        const rect = {
            x: Math.min(startPos.x, endPos.x) * dpr,
            y: Math.min(startPos.y, endPos.y) * dpr,
            w: Math.abs(startPos.x - endPos.x) * dpr,
            h: Math.abs(startPos.y - endPos.y) * dpr,
        };

        if (rect.w < 10 || rect.h < 10) {
            cleanup();
            return;
        }
        
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = rect.w;
        cropCanvas.height = rect.h;
        const cropCtx = cropCanvas.getContext('2d');
        
        if(cropCtx) {
            cropCtx.drawImage(
                canvas,
                rect.x, rect.y, rect.w, rect.h,
                0, 0, rect.w, rect.h
            );
            const dataUrl = cropCanvas.toDataURL('image/png');
            chrome.runtime.sendMessage({ type: 'screenshotTaken', dataUrl: dataUrl });
        }
        cleanup();
    };
    
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    
    (async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
            streamRef = stream;
            const video = document.createElement('video');
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                const track = stream.getVideoTracks()[0];
                const { width, height } = track.getSettings();
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                stream.getTracks().forEach(track => track.stop());
                streamRef = null;
            };
        } catch (err) {
            console.error("AI Sidekick: Screen capture failed or cancelled.", err);
            cleanup();
        }
    })();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'startScreenshotSelection') {
        initiateScreenshotSelection();
    }
});
