
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session } from './types';
import { INITIAL_PLACEHOLDERS } from './constants';
import { generateId } from './utils';

import NeuralMeshBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import { 
    ThinkingIcon, 
    ArrowUpIcon, 
    GridIcon
} from './components/Icons';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

// Icons for UI
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const AddMediaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-15 9 9 0 0 0-6 2.3L3 13"/></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-15 9 9 0 0 1 6 2.3L21 13"/></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const LayerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V5a5 5 0 0 1 9.9-1"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
const TypeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;

const LUXURY_FONTS = [
    'Inter', 'Montserrat', 'Bebas Neue', 'Playfair Display', 
    'Prata', 'Cinzel', 'Cormorant Garamond', 'Oswald', 'Poppins', 'Roboto Condensed',
    'Great Vibes', 'Lora', 'Fraunces', 'Unbounded', 'Syne', 'Space Grotesk', 'Syncopate', 
    'Stalemate', 'Rye', 'Eater', 'Megrim', 'Lobster', 'Righteous', 'Abril Fatface', 'Quicksand', 'Titillium Web'
];

const TEXT_PRESETS = [
    "TIÊU ĐỀ CHÍNH", "Nội dung chi tiết", "MUA NGAY", "GIẢM GIÁ 50%", "LIMITED EDITION", "THÔNG TIN SẢN PHẨM", "2025 TREND"
];

const ICON_SET = [
    { name: 'Home', svg: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { name: 'Heart', svg: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
    { name: 'Star', svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    { name: 'Check', svg: '<polyline points="20 6 9 17 4 12"/>' },
    { name: 'Settings', svg: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' },
    { name: 'User', svg: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { name: 'Search', svg: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
    { name: 'Bell', svg: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' },
    { name: 'Mail', svg: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
    { name: 'Message', svg: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' },
    { name: 'Camera', svg: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' },
    { name: 'Play', svg: '<polygon points="5 3 19 12 5 21 5 3"/>' },
    { name: 'Flash', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
    { name: 'Trend', svg: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
    { name: 'ShoppingCart', svg: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' },
    { name: 'Diamond', svg: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l3 12"/><path d="m13 3 3 6-3 12"/><path d="M2 9h20"/>' },
    { name: 'Flame', svg: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
    { name: 'Globe', svg: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
    { name: 'Trophy', svg: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>' },
    { name: 'Rocket', svg: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-11 22 22 0 0 1 11 2l-3 3"/><path d="M9 12a40 40 0 0 0-6.75 2.5c-.35.15-.35.65 0 .8L9 18a40 40 0 0 0 2.5 6.75c.15.35.65.35.8 0L15 18"/>' },
    { name: 'Sun', svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    { name: 'Moon', svg: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
    { name: 'Shield', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>' },
    { name: 'Lock', svg: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' }
];

type AspectRatio = '16:9' | '9:16' | '9:19.5' | '1:1' | '21:9' | '4:5' | '4:3' | '3:2';

interface DesignState {
    html: string;
    bgOpacity: number;
    bgColor: string;
    baseImage: string | null;
}

interface LayerItem {
    id: string;
    type: string;
    name: string;
    isLocked: boolean;
    isVisible: boolean;
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:19.5');
  const [hasChosenRatio, setHasChosenRatio] = useState<boolean>(false);
  
  const [bgOpacity, setBgOpacity] = useState<number>(1);
  const [bgColor, setBgColor] = useState<string>('#000000');

  // Quản lý lịch sử (Undo/Redo)
  const [history, setHistory] = useState<DesignState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isNavigatingHistory = useRef(false);

  const [initialState, setInitialState] = useState<DesignState | null>(null);

  const [savedDesigns, setSavedDesigns] = useState<{id: string, name: string, data: DesignState, ratio: string}[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [customText, setCustomText] = useState('');
  const [urlIconValue, setUrlIconValue] = useState('');
  const [layers, setLayers] = useState<LayerItem[]>([]);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'text' | 'image' | 'icon' | null>(null);
  const [elementStyles, setElementStyles] = useState({ 
    color: '#ffffff', 
    fontSize: '24px', 
    fontFamily: 'Inter',
    fontWeight: '700',
    fontStyle: 'normal',
    textAlign: 'center',
    opacity: '1',
    borderRadius: '0px',
    backgroundColor: 'transparent'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasStarted = sessions.length > 0;

  // Tự động lưu lịch sử khi trạng thái thay đổi (Debounced)
  useEffect(() => {
    if (isNavigatingHistory.current) {
        isNavigatingHistory.current = false;
        return;
    }
    if (!hasStarted || isLoading) return;

    const currentHtml = sessions[0]?.artifacts[0]?.html || '';
    if (!currentHtml) return;

    const timer = setTimeout(() => {
        const newState: DesignState = {
            html: currentHtml,
            bgOpacity,
            bgColor,
            baseImage
        };

        // So sánh với trạng thái hiện tại trên đầu stack để tránh lưu trùng lặp
        if (historyIndex >= 0 && history[historyIndex]) {
            const head = history[historyIndex];
            if (head.html === newState.html && 
                head.bgOpacity === newState.bgOpacity && 
                head.bgColor === newState.bgColor && 
                head.baseImage === newState.baseImage) {
                return;
            }
        }

        setHistory(prev => {
            const nextHistory = prev.slice(0, historyIndex + 1);
            const updated = [...nextHistory, newState].slice(-40); // Giữ tối đa 40 bước undo
            setHistoryIndex(updated.length - 1);
            return updated;
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [sessions[0]?.artifacts[0]?.html, bgOpacity, bgColor, baseImage, hasStarted, isLoading]);

  useEffect(() => {
    const saved = localStorage.getItem('flash_studio_saved_designs');
    if (saved) {
        try {
            setSavedDesigns(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse saved designs", e);
        }
    }
  }, []);

  const clearLocalHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử thiết kế không? Thao tác này không thể hoàn tác.")) {
        localStorage.removeItem('flash_studio_saved_designs');
        setSavedDesigns([]);
    }
  };

  const saveToLocalHistory = () => {
    if (!hasStarted) return;
    const currentDesign: DesignState = {
        html: sessions[0].artifacts[0].html,
        bgOpacity,
        bgColor,
        baseImage
    };
    
    const attemptSave = (list: typeof savedDesigns) => {
        const nextList = [{
            id: generateId(),
            name: sessions[0].prompt || "Untitled Design",
            data: currentDesign,
            ratio: selectedRatio
        }, ...list].slice(0, 15);

        try {
            const serialized = JSON.stringify(nextList);
            localStorage.setItem('flash_studio_saved_designs', serialized);
            setSavedDesigns(nextList);
            alert("Đã lưu thiết kế vào lịch sử!");
            return true;
        } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                if (list.length > 0) {
                    console.warn("Storage full, removing oldest record...");
                    return attemptSave(list.slice(0, -1));
                } else {
                    alert("Bộ nhớ đầy! Vui lòng xóa bớt thiết kế cũ hoặc dùng ảnh nền nhẹ hơn.");
                    return false;
                }
            }
            return false;
        }
    };

    attemptSave(savedDesigns);
  };

  const loadSavedDesign = (design: any) => {
    if (!design || !design.data) return;
    setBaseImage(design.data.baseImage);
    setBgColor(design.data.bgColor);
    setBgOpacity(design.data.bgOpacity);
    setSelectedRatio(design.ratio as AspectRatio);
    setHasChosenRatio(true);
    
    const sessionId = generateId();
    // Fix: Explicitly type loadedSession as Session to ensure the status field is treated as a literal and compatible with the Artifact interface.
    const loadedSession: Session = {
        id: sessionId,
        prompt: design.name,
        timestamp: Date.now(),
        artifacts: [{
            id: sessionId + '_0',
            styleName: 'Flash Studio Engine',
            html: design.data.html,
            status: 'complete'
        }]
    };
    
    setSessions([loadedSession]);
    
    // Reset history when loading new design
    const state = {
        html: design.data.html,
        bgOpacity: design.data.bgOpacity,
        bgColor: design.data.bgColor,
        baseImage: design.data.baseImage
    };
    setHistory([state]);
    setHistoryIndex(0);
    setShowHistoryPanel(false);
  };

  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
        if (e.data.type === 'ELEMENT_SELECTED') {
            setSelectedElementId(e.data.elementId);
            const tagName = e.data.tagName?.toLowerCase();
            let type: any = 'text';
            if (tagName === 'img') type = 'image';
            else if (e.data.isIcon) type = 'icon';
            
            setSelectedElementType(type);
            setElementStyles({
                color: e.data.styles.color || '#ffffff',
                fontSize: e.data.styles.fontSize || '24px',
                fontFamily: e.data.styles.fontFamily?.replace(/"/g, '') || 'Inter',
                fontWeight: e.data.styles.fontWeight || '700',
                fontStyle: e.data.styles.fontStyle || 'normal',
                textAlign: e.data.styles.textAlign || 'center',
                opacity: e.data.styles.opacity || '1',
                borderRadius: e.data.styles.borderRadius || '0px',
                backgroundColor: e.data.styles.backgroundColor || 'transparent'
            });
        } else if (e.data.type === 'HTML_CHANGED') {
            setSessions(prev => {
                if (!prev.length) return prev;
                const newHtml = e.data.html;
                if (prev[0].artifacts[0].html === newHtml) return prev;
                const updated = [...prev];
                updated[0].artifacts[0].html = newHtml;
                return updated;
            });
        } else if (e.data.type === 'LAYERS_UPDATED') {
            setLayers(e.data.layers);
        }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [bgOpacity, bgColor, baseImage]);

  const updateElementStyle = (property: string, value: string) => {
      if (!selectedElementId) return;
      setElementStyles(prev => ({ ...prev, [property]: value }));
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
          iframe.contentWindow?.postMessage({
              type: 'UPDATE_ELEMENT_STYLE',
              elementId: selectedElementId,
              property,
              value
          }, '*');
      });
  };

  const sendIframeMessage = (type: string, payload: any = {}) => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
          iframe.contentWindow?.postMessage({ type, ...payload }, '*');
      });
  };

  const handleDeleteElement = () => {
      if (!selectedElementId) return;
      sendIframeMessage('DELETE_ELEMENT', { elementId: selectedElementId });
      setSelectedElementId(null);
      setSelectedElementType(null);
  };

  const handleAddText = (text: string) => {
      sendIframeMessage('ADD_TEXT', { text });
      setShowTextPicker(false);
      setCustomText('');
  };

  const handleAddIcon = (iconSvg: string) => {
      sendIframeMessage('ADD_ICON', { iconSvg });
      setShowIconPicker(false);
  };

  const handleAddIconUrl = (url: string) => {
      if (!url.trim()) return;
      sendIframeMessage('ADD_ASSET', { data: url });
      setShowIconPicker(false);
      setUrlIconValue('');
  };

  const handleAddAsset = (base64: string) => sendIframeMessage('ADD_ASSET', { data: base64 });
  
  const handleLayerAction = (layerId: string, action: 'lock' | 'hide' | 'moveUp' | 'moveDown' | 'moveTop' | 'moveBottom' | 'select') => {
      sendIframeMessage('LAYER_ACTION', { layerId, action });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
        isNavigatingHistory.current = true;
        const prevIdx = historyIndex - 1;
        const state = history[prevIdx];
        setHistoryIndex(prevIdx);
        applyState(state);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        isNavigatingHistory.current = true;
        const nextIdx = historyIndex + 1;
        const state = history[nextIdx];
        setHistoryIndex(nextIdx);
        applyState(state);
    }
  };

  const handleReset = () => {
    if (initialState) {
        isNavigatingHistory.current = true;
        applyState(initialState);
        setHistory([initialState]);
        setHistoryIndex(0);
    }
  };

  const applyState = (state: DesignState) => {
    if (!state) return;
    setBaseImage(state.baseImage);
    setBgOpacity(state.bgOpacity);
    setBgColor(state.bgColor);
    setSessions(prev => {
        if (!prev.length) return prev;
        const updated = [...prev];
        updated[0].artifacts[0].html = state.html;
        return updated;
    });
  };

  const handleGenerateFullThumbnail = async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    if (!promptToUse.trim() || isLoading) return;

    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) await window.aistudio.openSelectKey();
    }

    setIsLoading(true);
    if (!manualPrompt) setInputValue('');

    const sessionId = generateId();
    const placeholderArtifacts: Artifact[] = [{
        id: `${sessionId}_0`,
        styleName: `Flash Studio Engine`,
        html: '',
        status: 'streaming',
    }];

    const newSession: Session = {
        id: sessionId, prompt: promptToUse, timestamp: Date.now(), artifacts: placeholderArtifacts
    };

    setSessions([newSession]);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const verticalContext = selectedRatio.startsWith('9:') || selectedRatio === '4:5' ? "vertical cinematic framing" : "wide high-res landscape";
        
        const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: `Professional high-end background poster art. ${verticalContext}. Theme: ${promptToUse}. Deep blacks, luxury studio lighting, 8k texture, minimal abstract elements. No text, no icons.` }] }],
            config: { imageConfig: { aspectRatio: (selectedRatio === '9:19.5' ? '9:16' : selectedRatio === '21:9' ? '16:9' : selectedRatio) as any } }
        });
        
        let generatedBg = '';
        for (const part of imgResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                generatedBg = `data:image/png;base64,${part.inlineData.data}`;
                setBaseImage(generatedBg);
                break;
            }
        }

        const designPrompt = `
            You are a Master UI Designer. Create a premium poster design.
            Theme: "${promptToUse}". Ratio: ${selectedRatio}. 
            
            DESIGN:
            1. Massive bold headings for high visual impact.
            2. Minimal luxury vibes.
            3. Vertical layouts for phone screen ratios.

            TECHNICAL:
            - Output ONLY <style> and <div id="main-canvas">...</div>
            - Use IDs for ALL elements.
            - Ensure text elements are easily selectable.
        `;

        const stream = await ai.models.generateContentStream({ 
            model: 'gemini-3-flash-preview', 
            contents: designPrompt 
        });

        let accumulatedHtml = '';
        for await (const chunk of stream) {
            accumulatedHtml += chunk.text;
            const cleaned = accumulatedHtml.replace(/```html/gi, '').replace(/```/g, '').trim();
            setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s, artifacts: s.artifacts.map(a => a.id === placeholderArtifacts[0].id ? { ...a, html: cleaned } : a)
            } : s));
        }

        const finalHtmlCleaned = accumulatedHtml.replace(/```html/gi, '').replace(/```/g, '').trim();

        const studioScript = `
            <script>
                (function() {
                    let activeEl = null;
                    let isDragging = false;
                    let isResizing = false;
                    let startX, startY, initialW, initialH, initialX, initialY;
                    let changeTimeout = null;
                    const CLICK_THRESHOLD = 3; 

                    const notifyParentOfChange = () => {
                        if (changeTimeout) clearTimeout(changeTimeout);
                        changeTimeout = setTimeout(() => {
                            window.parent.postMessage({
                                type: 'HTML_CHANGED',
                                html: document.documentElement.outerHTML
                            }, '*');
                            syncLayers();
                        }, 50);
                    };

                    const syncLayers = () => {
                        const canvas = document.getElementById('main-canvas');
                        if (!canvas) return;
                        const layers = Array.from(canvas.children).map(el => ({
                            id: el.id,
                            name: el.getAttribute('data-name') || (el.innerText ? el.innerText.substring(0, 15) : (el.tagName === 'IMG' ? 'Image' : 'Element')),
                            type: el.tagName,
                            isLocked: el.getAttribute('data-locked') === 'true',
                            isVisible: el.style.display !== 'none'
                        })).reverse();
                        window.parent.postMessage({ type: 'LAYERS_UPDATED', layers }, '*');
                    };

                    const loadFont = (f) => {
                        const l = document.createElement('link');
                        l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/\\s+/g, '+') + ':wght@400;700;900&display=swap';
                        l.rel = 'stylesheet'; document.head.appendChild(l);
                    };

                    const createResizer = (el) => {
                        document.querySelectorAll('.resizer-handle').forEach(h => h.remove());
                        if (el.getAttribute('data-locked') === 'true') return;

                        const h = document.createElement('div');
                        h.className = 'resizer-handle';
                        h.style = "width:22px; height:22px; background:#6366f1; border:3px solid #fff; border-radius:50%; position:absolute; bottom:-11px; right:-11px; cursor:nwse-resize; z-index:9999; box-shadow:0 0 10px rgba(0,0,0,0.5);";
                        el.appendChild(h);
                        
                        h.addEventListener('pointerdown', (e) => {
                            e.stopPropagation();
                            isResizing = true;
                            activeEl = el;
                            startX = e.clientX;
                            startY = e.clientY;
                            initialW = el.offsetWidth;
                            initialH = el.offsetHeight;
                            h.setPointerCapture(e.pointerId);
                        });
                    };

                    const setupDragging = (el) => {
                        if (!el.id) el.id = 'el_' + Math.random().toString(36).substr(2, 9);
                        
                        el.style.pointerEvents = 'auto';
                        el.style.userSelect = 'text';
                        
                        const isLocked = el.getAttribute('data-locked') === 'true';

                        if (el.tagName !== 'IMG' && el.tagName !== 'SVG' && !el.classList.contains('studio-icon')) {
                            el.contentEditable = isLocked ? "false" : "true";
                            el.oninput = notifyParentOfChange;
                        }

                        el.addEventListener('pointerdown', (e) => {
                            if (document.body.getAttribute('data-edit-mode') !== 'true') return;
                            if (isResizing) return;
                            
                            document.querySelectorAll('.selected-el').forEach(i => i.classList.remove('selected-el'));
                            el.classList.add('selected-el');
                            createResizer(el);

                            const styles = window.getComputedStyle(el);
                            const svgEl = el.querySelector('svg');
                            
                            window.parent.postMessage({
                                type: 'ELEMENT_SELECTED', 
                                elementId: el.id,
                                tagName: el.tagName,
                                isIcon: el.classList.contains('studio-icon'),
                                styles: { 
                                    color: svgEl ? svgEl.style.color || styles.color : styles.color, 
                                    fontSize: styles.fontSize, 
                                    fontFamily: styles.fontFamily, 
                                    fontWeight: styles.fontWeight,
                                    fontStyle: styles.fontStyle,
                                    textAlign: styles.textAlign,
                                    opacity: styles.opacity,
                                    borderRadius: styles.borderRadius,
                                    backgroundColor: styles.backgroundColor
                                }
                            }, '*');

                            if (el.getAttribute('data-locked') === 'true') return;

                            activeEl = el;
                            startX = e.clientX;
                            startY = e.clientY;
                            initialX = el.offsetLeft;
                            initialY = el.offsetTop;
                        });

                        window.addEventListener('pointermove', (e) => {
                            if (!activeEl) return;
                            
                            if (isResizing) {
                                const dx = e.clientX - startX;
                                const dy = e.clientY - startY;
                                const newW = Math.max(20, initialW + dx);
                                activeEl.style.width = newW + 'px';
                                
                                if (activeEl.classList.contains('studio-icon')) {
                                    activeEl.style.height = newW + 'px';
                                } else if (activeEl.tagName === 'DIV' || activeEl.tagName === 'P' || activeEl.tagName.startsWith('H')) {
                                    activeEl.style.height = 'auto';
                                } else {
                                    activeEl.style.height = Math.max(20, initialH + dy) + 'px';
                                }
                                return;
                            }

                            const moveDist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
                            
                            if (!isDragging && moveDist > CLICK_THRESHOLD) {
                                isDragging = true;
                                activeEl.setPointerCapture(e.pointerId);
                                if (activeEl.contentEditable === "true") activeEl.blur();
                            }

                            if (isDragging) {
                                const dx = e.clientX - startX;
                                const dy = e.clientY - startY;
                                activeEl.style.left = (initialX + dx) + 'px';
                                activeEl.style.top = (initialY + dy) + 'px';
                                activeEl.style.position = 'absolute';
                                activeEl.style.margin = '0';
                            }
                        });

                        window.addEventListener('pointerup', (e) => {
                            if (isDragging || isResizing) {
                                notifyParentOfChange();
                            }
                            isDragging = false;
                            isResizing = false;
                            activeEl = null;
                        });
                    };

                    window.addEventListener('message', (e) => {
                        const canvas = document.getElementById('main-canvas');
                        if (e.data.type === 'UPDATE_ELEMENT_STYLE') {
                            const el = document.getElementById(e.data.elementId);
                            if (el) {
                                if (e.data.property === 'fontFamily') loadFont(e.data.value);
                                
                                if (el.classList.contains('studio-icon') && (e.data.property === 'color' || e.data.property === 'backgroundColor')) {
                                    const svg = el.querySelector('svg');
                                    if (svg) svg.style.color = e.data.value;
                                }

                                el.style[e.data.property] = e.data.value;
                                notifyParentOfChange();
                            }
                        } else if (e.data.type === 'DELETE_ELEMENT') {
                            const el = document.getElementById(e.data.elementId);
                            if (el) { el.remove(); notifyParentOfChange(); }
                        } else if (e.data.type === 'ADD_TEXT') {
                            const n = document.createElement('div');
                            n.id = 'n_' + Date.now(); 
                            n.innerText = e.data.text || 'NHẬP CHỮ...';
                            n.style = "color:white; font-size:48px; font-weight:900; font-family:Montserrat; position:absolute; top:40%; left:10%; z-index:999; padding:10px; text-align:center; min-width:150px; cursor:move;";
                            canvas.appendChild(n);
                            setupDragging(n);
                            setTimeout(() => {
                                n.focus();
                                const range = document.createRange(); range.selectNodeContents(n);
                                const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
                            }, 10);
                            notifyParentOfChange();
                        } else if (e.data.type === 'ADD_ICON') {
                            const icWrap = document.createElement('div');
                            icWrap.id = 'ic_' + Date.now();
                            icWrap.className = 'studio-icon';
                            icWrap.setAttribute('data-name', 'Icon');
                            icWrap.style = "width:100px; height:100px; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:998; display:flex; align-items:center; justify-content:center; cursor:move;";
                            icWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;">' + e.data.iconSvg + '</svg>';
                            canvas.appendChild(icWrap);
                            setupDragging(icWrap);
                            notifyParentOfChange();
                        } else if (e.data.type === 'ADD_ASSET') {
                            const img = document.createElement('img');
                            img.id = 'img_' + Date.now();
                            img.src = e.data.data;
                            img.style = "width:180px; height:auto; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:998; border-radius:0px; cursor:move;";
                            canvas.appendChild(img);
                            setupDragging(img);
                            notifyParentOfChange();
                        } else if (e.data.type === 'LAYER_ACTION') {
                            const el = document.getElementById(e.data.layerId);
                            if (!el) return;
                            switch(e.data.action) {
                                case 'lock': 
                                    const val = el.getAttribute('data-locked') === 'true' ? 'false' : 'true';
                                    el.setAttribute('data-locked', val);
                                    if (el.tagName !== 'IMG' && !el.classList.contains('studio-icon')) el.contentEditable = val === 'true' ? 'false' : 'true';
                                    break;
                                case 'hide': el.style.display = el.style.display === 'none' ? 'block' : 'none'; break;
                                case 'moveUp': if (el.nextElementSibling) canvas.insertBefore(el.nextElementSibling, el); break;
                                case 'moveDown': if (el.previousElementSibling) canvas.insertBefore(el, el.previousElementSibling); break;
                                case 'moveTop': canvas.appendChild(el); break;
                                case 'moveBottom': canvas.prepend(el); break;
                                case 'select': el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); break;
                            }
                            notifyParentOfChange();
                        }
                    });

                    window.addEventListener('DOMContentLoaded', () => {
                        const canvas = document.getElementById('main-canvas');
                        if (canvas) {
                            Array.from(canvas.children).forEach(setupDragging);
                            syncLayers();
                        }
                    });
                })();
            </script>
        `;

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Playfair+Display:wght@700;900&family=Cinzel:wght@700;900&family=Bebas+Neue&family=Unbounded:wght@400;700;900&family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;700&family=Syncopate:wght@400;700&family=Stalemate&family=Rye&family=Eater&family=Megrim&family=Lobster&family=Righteous&family=Abril+Fatface&family=Quicksand&family=Titillium+Web&display=swap" rel="stylesheet" crossorigin="anonymous">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; }
                    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; color: #fff; }
                    #main-canvas { 
                        position: relative; width: 100%; height: 100%; 
                        background-size: cover; background-position: center;
                        display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
                        font-family: 'Inter', sans-serif;
                        overflow: hidden;
                    }
                    .selected-el { outline: 3px solid #6366f1 !important; outline-offset: 4px; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); z-index: 1000 !important; }
                    img, .studio-icon { display: block; user-select: none; transition: border-radius 0.1s; }
                    [contenteditable="true"] { outline: none !important; cursor: text; user-select: text !important; }
                    [contenteditable="true"]:hover { background: rgba(255,255,255,0.05); }
                    [data-locked="true"] { pointer-events: none !important; user-select: none !important; }
                </style>
            </head>
            <body data-edit-mode="false">
                ${finalHtmlCleaned}
                ${studioScript}
            </body>
            </html>
        `;

        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s, artifacts: s.artifacts.map(a => a.id === placeholderArtifacts[0].id ? { ...a, html: fullHtml, status: 'complete' } : a)
        } : s));

        const initial: DesignState = {
            html: fullHtml,
            bgOpacity: 1,
            bgColor: '#000000',
            baseImage: generatedBg
        };
        
        setInitialState(initial);
        setHistory([initial]);
        setHistoryIndex(0);

    } catch (e: any) { 
        console.error(e);
        setIsLoading(false);
    } finally { 
        setIsLoading(false); 
    }
  };

  return (
    <div className="immersive-app" ref={scrollRef}>
        <NeuralMeshBackground />

        {!hasStarted && !hasChosenRatio && (
            <div className="ratio-selector-screen">
                <div className="empty-content">
                    <h1>Flash Studio</h1>
                    <p>Khởi tạo thiết kế chuyên nghiệp</p>
                    <div className="ratio-grid">
                        <button onClick={() => {setSelectedRatio('9:19.5'); setHasChosenRatio(true);}} className="ratio-btn special">
                            <div className="ratio-box r-9-19-5"><div className="notch"></div></div>
                            <span>iPhone (9:19.5)</span>
                        </button>
                        <button onClick={() => {setSelectedRatio('9:16'); setHasChosenRatio(true);}} className="ratio-btn">
                            <div className="ratio-box r-9-16"></div>
                            <span>Portrait (9:16)</span>
                        </button>
                        <button onClick={() => {setSelectedRatio('16:9'); setHasChosenRatio(true);}} className="ratio-btn">
                            <div className="ratio-box r-16-9"></div>
                            <span>Landscape (16:9)</span>
                        </button>
                        <button onClick={() => {setSelectedRatio('1:1'); setHasChosenRatio(true);}} className="ratio-btn">
                            <div className="ratio-box r-1-1"></div>
                            <span>Square (1:1)</span>
                        </button>
                        
                        {/* HD Options */}
                        <button onClick={() => {setSelectedRatio('21:9'); setHasChosenRatio(true);}} className="ratio-btn special-hd">
                            <div className="ratio-box r-21-9"></div>
                            <span>UltraWide (21:9)</span>
                        </button>
                        <button onClick={() => {setSelectedRatio('4:5'); setHasChosenRatio(true);}} className="ratio-btn special-hd">
                            <div className="ratio-box r-4-5"></div>
                            <span>HD Social (4:5)</span>
                        </button>
                        <button onClick={() => {setSelectedRatio('4:3'); setHasChosenRatio(true);}} className="ratio-btn special-hd">
                            <div className="ratio-box r-4-3"></div>
                            <span>Classic HD (4:3)</span>
                        </button>
                        <button onClick={() => {setSelectedRatio('3:2'); setHasChosenRatio(true);}} className="ratio-btn special-hd">
                            <div className="ratio-box r-3-2"></div>
                            <span>HD Pro (3:2)</span>
                        </button>
                    </div>
                    {savedDesigns.length > 0 && (
                        <button className="history-trigger-btn" onClick={() => setShowHistoryPanel(true)}><HistoryIcon /> Xem Lịch sử Thiết kế</button>
                    )}
                </div>
            </div>
        )}

        {showHistoryPanel && (
            <div className="history-modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="header-title-wrap">
                            <h2>Lịch sử Thiết kế</h2>
                            <span className="storage-info">{savedDesigns.length}/15 slots</span>
                        </div>
                        <div className="header-actions">
                            <button className="clear-all-btn" onClick={clearLocalHistory}>Xóa Toàn Bộ</button>
                            <button className="close-btn" onClick={() => setShowHistoryPanel(false)}>&times;</button>
                        </div>
                    </div>
                    <div className="saved-designs-grid">
                        {savedDesigns.length === 0 && <div className="empty-message">Bạn chưa có thiết kế nào được lưu.</div>}
                        {savedDesigns.map(design => (
                            <div key={design.id} className="saved-card" onClick={() => loadSavedDesign(design)}>
                                <div className="saved-preview" style={{backgroundImage: design.data?.baseImage ? `url(${design.data.baseImage})` : 'none'}}>
                                    <span className="ratio-badge">{design.ratio}</span>
                                </div>
                                <div className="saved-info">
                                    <h3>{design.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {showLayersPanel && (
            <div className="history-modal">
                <div className="modal-content layer-panel">
                    <div className="modal-header">
                        <h2>Quản lý Layer</h2>
                        <button className="close-btn" onClick={() => setShowLayersPanel(false)}>&times;</button>
                    </div>
                    <div className="layers-list">
                        {layers.length === 0 && <div className="empty-layers">Chưa có layer nào</div>}
                        {layers.map((layer, idx) => (
                            <div key={layer.id} className={`layer-item ${selectedElementId === layer.id ? 'active' : ''}`} onClick={() => handleLayerAction(layer.id, 'select')}>
                                <div className="layer-info">
                                    <span className="layer-idx">{layers.length - idx}</span>
                                    <span className="layer-name">{layer.name}</span>
                                </div>
                                <div className="layer-actions">
                                    <button onClick={(e) => { e.stopPropagation(); handleLayerAction(layer.id, 'lock'); }} className={layer.isLocked ? 'active' : ''}>
                                        {layer.isLocked ? <LockIcon /> : <UnlockIcon />}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleLayerAction(layer.id, 'hide'); }} className={!layer.isVisible ? 'hidden' : ''}>
                                        <EyeIcon />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleLayerAction(layer.id, 'moveUp'); }}>↑</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleLayerAction(layer.id, 'moveDown'); }}>↓</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {showTextPicker && (
            <div className="history-modal" onClick={() => setShowTextPicker(false)}>
                <div className="modal-content text-picker-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Chọn Nội dung Chữ</h2>
                        <button className="close-btn" onClick={() => setShowTextPicker(false)}>&times;</button>
                    </div>
                    <div className="text-picker-body">
                        <div className="custom-text-input">
                            <input 
                                type="text" 
                                placeholder="Nhập nội dung tùy ý..." 
                                value={customText} 
                                onChange={e => setCustomText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && customText && handleAddText(customText)}
                            />
                            <button onClick={() => customText && handleAddText(customText)} disabled={!customText}>Thêm</button>
                        </div>
                        <div className="text-presets-grid">
                            {TEXT_PRESETS.map(preset => (
                                <button key={preset} className="text-preset-btn" onClick={() => handleAddText(preset)}>
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showIconPicker && (
            <div className="history-modal" onClick={() => setShowIconPicker(false)}>
                <div className="modal-content icon-picker-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Thêm Biểu tượng / Icon URL</h2>
                        <button className="close-btn" onClick={() => setShowIconPicker(false)}>&times;</button>
                    </div>
                    <div className="text-picker-body" style={{ paddingBottom: 0 }}>
                        <div className="custom-text-input">
                            <input 
                                type="text" 
                                placeholder="Dán link ảnh (PNG/SVG) vào đây..." 
                                value={urlIconValue} 
                                onChange={e => setUrlIconValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddIconUrl(urlIconValue)}
                            />
                            <button onClick={() => handleAddIconUrl(urlIconValue)} disabled={!urlIconValue.trim()}>Thêm URL</button>
                        </div>
                    </div>
                    <div className="icon-grid">
                        {ICON_SET.map(icon => (
                            <button key={icon.name} className="icon-choice" onClick={() => handleAddIcon(icon.svg)} title={icon.name}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                                <span>{icon.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {!hasStarted && hasChosenRatio && (
            <div className="empty-state">
                <div className="empty-content">
                    <h1>Màn hình {selectedRatio}</h1>
                    <p>Chọn chủ đề mẫu</p>
                    <div className="theme-deck always-visible">
                        {INITIAL_PLACEHOLDERS.map((theme, i) => (
                            <div key={i} className="theme-card-flip" onClick={() => handleGenerateFullThumbnail(theme)}>
                                <div className="theme-card-inner">
                                    <div className={`theme-card-front v3-aura-gradient-${(i % 20) + 1}`}><span>{theme.split(':')[0]}</span></div>
                                    <div className="theme-card-back"><p>{theme}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="back-btn" onClick={() => setHasChosenRatio(false)}>Quay lại</button>
                </div>
            </div>
        )}

        <div className="stage-container">
            {sessions.map((session) => (
                <div key={session.id} className="session-group">
                    <div className="grid-wrapper">
                        <div className={`artifact-grid ratio-${selectedRatio.replace(':', '-')}`}>
                            {session.artifacts.map((artifact) => (
                                <ArtifactCard 
                                    key={artifact.id} 
                                    artifact={artifact} 
                                    isFocused={false} 
                                    onClick={() => {}} 
                                    isEditMode={isEditMode}
                                    baseImage={baseImage}
                                    ratio={selectedRatio}
                                    bgOpacity={bgOpacity}
                                    bgColor={bgColor}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className={`floating-input-container ${hasStarted ? 'active' : ''}`}>
            {hasStarted && (
                <div className="studio-tools-bar animated-up scrollable-tools">
                    <div className="tool-section vertical-tool">
                        <div className="button-group">
                            <button onClick={() => fileInputRef.current?.click()} className="icon-only" title="Đổi ảnh nền"><UploadIcon /></button>
                            <div className="bg-property-controls">
                                <div className="slider-group">
                                    <input type="range" min="0" max="1" step="0.1" value={bgOpacity} onChange={(e) => setBgOpacity(parseFloat(e.target.value))}  title="Xóa mờ ảnh nền" />
                                </div>
                                <div className="color-picker-wrap mini">
                                    <input type="color" className="text-pxwide" value={bgColor} onChange={(e) => setBgColor(e.target.value)} title="Màu nền phụ" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="tool-divider" />

                    <div className="tool-section vertical-tool">
                        <div className="button-group">
                            <button onClick={handleUndo} disabled={historyIndex <= 0} title="Undo"><UndoIcon /></button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo"><RedoIcon /></button>
                            <button onClick={() => setShowLayersPanel(true)} className={showLayersPanel ? 'active-tool' : ''} title="Layer Management"><LayerIcon /> Layers</button>
                            <button onClick={saveToLocalHistory} className="save-btn" title="Lưu vào bộ nhớ tạm"><SaveIcon /> Save</button>
                        </div>
                    </div>

                    <div className="tool-divider" />
                    
                    <div className="tool-section vertical-tool">
                        <div className="button-group">
                            <button className={isEditMode ? 'active-tool' : ''} onClick={() => { setIsEditMode(!isEditMode); setSelectedElementId(null); }}  title="Chỉnh layer">
                                <EditIcon /> {isEditMode ? 'Done' : 'Edit Layer'}
                            </button>
                            {isEditMode && (
                                <>
                                    <button onClick={() => setShowTextPicker(true)} title="Thêm Chữ"><TypeIcon /> Text</button>
                                    <button onClick={() => setShowIconPicker(true)} title="Thêm Biểu tượng"><HeartIcon /> Icon</button>
                                    <button onClick={() => assetInputRef.current?.click()} className="highlight-btn" title="Thêm Ảnh"><AddMediaIcon /> Img </button>
                                    {selectedElementId && (
                                        <button className="delete-layer-btn" onClick={handleDeleteElement} title="Xóa Layer"><TrashIcon /></button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {isEditMode && selectedElementId && (
                        <>
                        <div className="tool-divider" />
                        <div className="tool-section vertical-tool property-editor">
                            <div className="button-group">
                                {selectedElementType === 'text' || selectedElementType === 'icon' ? (
                                    <>
                                        <div className="color-picker-wrap">
                                            <input type="color" value={elementStyles.color} onChange={(e) => updateElementStyle('color', e.target.value)} />
                                        </div>
                                        {selectedElementType === 'text' && (
                                            <>
                                                <select className="luxury-select" value={elementStyles.fontFamily} onChange={(e) => updateElementStyle('fontFamily', e.target.value)}>
                                                    {LUXURY_FONTS.sort().map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                                <select className="luxury-select size-select" value={elementStyles.fontSize} onChange={(e) => updateElementStyle('fontSize', e.target.value)}>
                                                    {[12,16,24,32,40,48,64,80,100,120,160,200,300,500,800].map(s => <option key={s} value={s+'px'}>{s}px</option>)}
                                                </select>
                                            </>
                                        )}
                                        <div className="slider-group">
                                            <input type="range" min="0" max="1" step="0.1" value={elementStyles.opacity} onChange={(e) => updateElementStyle('opacity', e.target.value)} title="Opacity Mờ ảnh"/>
                                        </div>
                                    </>
                                ) : (
                                    <div className="style-sliders-wrap">
                                        <div className="slider-group">
                                            <span>Opacity</span>
                                            <input type="range" min="0" max="1" step="0.1" value={elementStyles.opacity} onChange={(e) => updateElementStyle('opacity', e.target.value)}  title="Mờ ảnh" />
                                        </div>
                                        <div className="slider-group">
                                            <span>Round conner</span>
                                            <input type="range" min="0" max="50" step="1" value={parseInt(elementStyles.borderRadius)} onChange={(e) => updateElementStyle('borderRadius', e.target.value + '%')}  title="làm tròn" />
                                        </div>
                                        <button onClick={() => updateElementStyle('borderRadius', '50%')} className="mini-action-btn" title="Hình Tròn Hoàn Hảo">Circle</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        </>
                    )}
                    
                    <div className="tool-divider" />
                    <button onClick={() => handleGenerateFullThumbnail(sessions[0].prompt)}   title="Tạo Lại UI"><ImageIcon /> ⟳</button>

                    <button className="reset-btn-v2" onClick={() => {setSessions([]); setBaseImage(null); setIsEditMode(false); setHasChosenRatio(false);}}  title="Chọn lại screen size"><GridIcon /> Close</button>
                </div>
            )}

            <div className={`input-wrapper ${isLoading ? 'loading' : ''}`}>
                <input placeholder="UI prompt. Gõ ý tưởng thiết kế...vd: tạo UI thơ tình ướt át cho em yêu ! (skip API key selected to use free AI model) " value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerateFullThumbnail()} />
                <button className="main-action-btn" onClick={() => handleGenerateFullThumbnail()} disabled={isLoading || !inputValue.trim()}>
                    {isLoading ? <ThinkingIcon /> : <ArrowUpIcon />}
                </button>
            </div>
        </div>

        <footer className="luxury-footer">
            <div className="footer-links">
                <a href="https://8a5.com" target="_blank" rel="noopener noreferrer">8a5.com</a>
                <span className="footer-dot"></span>
                <a href="https://discord.gg/79RHa6MVUU" target="_blank" rel="noopener noreferrer">fcalgobot.com</a>
                <span className="footer-dot"></span>
                <a href="https://github.com/tienqnguyen" target="_blank" rel="noopener noreferrer">Github</a>
                 <span className="footer-dot"></span>
                <a href="https://aistudio.google.com/app/apps/bundled/flash_ui?showPreview=true&showAssistant=true&fullscreenApplet=true" target="_blank" rel="noopener noreferrer">Base on Ammaar Flash UI</a>
            </div>
            <div className="footer-tagline">AI Studio & Algorithm Excellence</div>
        </footer>

        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const res = ev.target?.result as string;
                    setBaseImage(res);
                };
                reader.readAsDataURL(file);
            }
        }} />

        <input type="file" ref={assetInputRef} hidden accept="image/*,image/svg+xml" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => handleAddAsset(ev.target?.result as string);
                reader.readAsDataURL(file);
            }
        }} />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
