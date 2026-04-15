import { createContext, useContext, useReducer, useRef, useCallback } from 'react';

const EditorContext = createContext(null);

const initialState = {
  // Project settings
  canvasRatio: '16:9', // '16:9', '9:16', '1:1', 'custom'
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundColor: '#000000',
  backgroundImage: null,
  backgroundFit: 'cover',
  
  // Media assets
  assets: [],
  fonts: [],
  
  // Timeline layers
  layers: {
    video: [],
    audio: [],
    text: [],
    image: [],
  },
  
  // Selected element
  selectedElement: null,
  selectedLayer: null,
  
  // Playback
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  
  // Timeline zoom
  timelineZoom: 1,
  
  // History for undo/redo
  history: [],
  historyIndex: -1,
};

function editorReducer(state, action) {
  switch (action.type) {
    case 'SET_CANVAS_RATIO':
      return {
        ...state,
        canvasRatio: action.payload.ratio,
        canvasWidth: action.payload.width || state.canvasWidth,
        canvasHeight: action.payload.height || state.canvasHeight,
      };
    
    case 'SET_BACKGROUND':
      return {
        ...state,
        backgroundColor: action.payload.color !== undefined ? action.payload.color : state.backgroundColor,
        backgroundImage: action.payload.image !== undefined ? action.payload.image : state.backgroundImage,
        backgroundFit: action.payload.fit || state.backgroundFit,
      };
    
    case 'ADD_ASSET':
      return {
        ...state,
        assets: [...state.assets, action.payload],
      };
    
    case 'REMOVE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(asset => asset.id !== action.payload),
      };
    
    case 'ADD_FONT':
      return {
        ...state,
        fonts: [...state.fonts, action.payload],
      };
    
    case 'ADD_LAYER_ITEM':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload.layer]: [...state.layers[action.payload.layer], action.payload.item],
        },
      };
    
    case 'UPDATE_LAYER_ITEM':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload.layer]: state.layers[action.payload.layer].map(
            item => item.id === action.payload.itemId ? { ...item, ...action.payload.updates } : item
          ),
        },
      };
    
    case 'REMOVE_LAYER_ITEM':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload.layer]: state.layers[action.payload.layer].filter(
            item => item.id !== action.payload.itemId
          ),
        },
      };
    
    case 'REORDER_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload.layer]: action.payload.items,
        },
      };
    
    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElement: action.payload,
      };
    
    case 'SELECT_LAYER':
      return {
        ...state,
        selectedLayer: action.payload,
      };
    
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload,
      };
    
    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.payload,
      };
    
    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload,
      };
    
    case 'SET_TIMELINE_ZOOM':
      return {
        ...state,
        timelineZoom: action.payload,
      };
    
    case 'SPLIT_CLIP':
      const layer = action.payload.layer;
      const itemId = action.payload.itemId;
      const splitTime = action.payload.splitTime;
      const items = state.layers[layer];
      const itemIndex = items.findIndex(item => item.id === itemId);
      const item = items[itemIndex];
      
      if (!item || splitTime <= item.startTime || splitTime >= item.startTime + item.duration) {
        return state;
      }
      
      const firstDuration = splitTime - item.startTime;
      const secondStartTime = splitTime;
      const secondDuration = item.duration - firstDuration;
      
      const newItem1 = {
        ...item,
        id: `${item.id}-split-1`,
        duration: firstDuration,
      };
      
      const newItem2 = {
        ...item,
        id: `${item.id}-split-2`,
        startTime: secondStartTime,
        duration: secondDuration,
        trimStart: item.trimStart !== undefined ? item.trimStart + firstDuration : firstDuration,
      };
      
      const newItems = [
        ...items.slice(0, itemIndex),
        newItem1,
        newItem2,
        ...items.slice(itemIndex + 1),
      ];
      
      return {
        ...state,
        layers: {
          ...state.layers,
          [layer]: newItems,
        },
      };
    
    case 'PUSH_HISTORY':
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.payload);
      return {
        ...state,
        history: newHistory.slice(-50), // Keep last 50 states
        historyIndex: newHistory.length - 1,
      };
    
    case 'UNDO':
      if (state.historyIndex > 0) {
        return {
          ...state,
          ...state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
        };
      }
      return state;
    
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          ...state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
        };
      }
      return state;
    
    case 'LOAD_PROJECT':
      return {
        ...initialState,
        ...action.payload,
      };
    
    default:
      return state;
  }
}

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const addToHistory = useCallback((newState) => {
    dispatch({ type: 'PUSH_HISTORY', payload: { layers: newState.layers } });
  }, []);
  
  const value = {
    state,
    dispatch,
    videoRef,
    canvasRef,
    
    // Canvas actions
    setCanvasRatio: (ratio, width, height) => {
      dispatch({ type: 'SET_CANVAS_RATIO', payload: { ratio, width, height } });
    },
    
    setBackground: (color, image, fit) => {
      dispatch({ type: 'SET_BACKGROUND', payload: { color, image, fit } });
    },
    
    // Asset actions
    addAsset: (asset) => {
      dispatch({ type: 'ADD_ASSET', payload: asset });
    },
    
    removeAsset: (id) => {
      dispatch({ type: 'REMOVE_ASSET', payload: id });
    },
    
    addFont: (font) => {
      dispatch({ type: 'ADD_FONT', payload: font });
    },
    
    // Layer actions
    addLayerItem: (layer, item) => {
      dispatch({ type: 'ADD_LAYER_ITEM', payload: { layer, item } });
      addToHistory({ layers: { ...state.layers, [layer]: [...state.layers[layer], item] } });
    },
    
    updateLayerItem: (layer, itemId, updates) => {
      dispatch({ type: 'UPDATE_LAYER_ITEM', payload: { layer, itemId, updates } });
    },
    
    removeLayerItem: (layer, itemId) => {
      dispatch({ type: 'REMOVE_LAYER_ITEM', payload: { layer, itemId } });
      addToHistory({ layers: { ...state.layers, [layer]: state.layers[layer].filter(item => item.id !== itemId) } });
    },
    
    reorderLayer: (layer, items) => {
      dispatch({ type: 'REORDER_LAYER', payload: { layer, items } });
    },
    
    // Selection actions
    selectElement: (element) => {
      dispatch({ type: 'SELECT_ELEMENT', payload: element });
    },
    
    selectLayer: (layer) => {
      dispatch({ type: 'SELECT_LAYER', payload: layer });
    },
    
    // Playback actions
    setPlaying: (playing) => {
      dispatch({ type: 'SET_PLAYING', payload: playing });
    },
    
    setCurrentTime: (time) => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    },
    
    setDuration: (duration) => {
      dispatch({ type: 'SET_DURATION', payload: duration });
    },
    
    // Timeline actions
    setTimelineZoom: (zoom) => {
      dispatch({ type: 'SET_TIMELINE_ZOOM', payload: zoom });
    },
    
    splitClip: (layer, itemId, splitTime) => {
      dispatch({ type: 'SPLIT_CLIP', payload: { layer, itemId, splitTime } });
    },
    
    // History actions
    undo: () => {
      dispatch({ type: 'UNDO' });
    },
    
    redo: () => {
      dispatch({ type: 'REDO' });
    },
    
    loadProject: (project) => {
      dispatch({ type: 'LOAD_PROJECT', payload: project });
    },
  };
  
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
