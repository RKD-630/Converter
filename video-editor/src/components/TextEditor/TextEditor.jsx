import { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Move, Sparkles } from 'lucide-react';

export function TextEditor() {
  const { state, selectedElement, updateLayerItem, addLayerItem } = useEditor();
  const [activeTab, setActiveTab] = useState('properties');
  
  if (!selectedElement || selectedElement.layerType !== 'text') {
    return (
      <div className="w-80 bg-dark-800 border-l border-dark-600 p-4 flex items-center justify-center text-gray-500">
        Select a text element to edit
      </div>
    );
  }
  
  const text = selectedElement;
  
  const handleAddText = () => {
    const newItem = {
      id: `text-item-${Date.now()}`,
      content: 'New Text',
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#ffffff',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
      position: { x: 100, y: 100 },
      scale: 1,
      rotation: 0,
      shadow: false,
      shadowColor: '#000000',
      shadowX: 2,
      shadowY: 2,
      shadowBlur: 4,
      outline: false,
      outlineColor: '#000000',
      outlineWidth: 2,
      backgroundColor: 'transparent',
      animation: null,
      animationSpeed: 1,
      startTime: state.currentTime,
      duration: 5,
    };
    
    addLayerItem('text', newItem);
  };

  return (
    <div className="w-80 bg-dark-800 border-l border-dark-600 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-600">
        <button
          onClick={handleAddText}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 rounded-lg text-white font-medium transition-colors"
        >
          <Type size={18} />
          Add Text
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-dark-600">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'properties'
              ? 'bg-dark-700 text-accent-500'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'animation'
              ? 'bg-dark-700 text-accent-500'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          Animation
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'effects'
              ? 'bg-dark-700 text-accent-500'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          Effects
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'properties' && (
          <TextProperties text={text} onUpdate={(updates) => updateLayerItem('text', text.id, updates)} />
        )}
        
        {activeTab === 'animation' && (
          <TextAnimation text={text} onUpdate={(updates) => updateLayerItem('text', text.id, updates)} />
        )}
        
        {activeTab === 'effects' && (
          <TextEffects text={text} onUpdate={(updates) => updateLayerItem('text', text.id, updates)} />
        )}
      </div>
    </div>
  );
}

function TextProperties({ text, onUpdate }) {
  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'];
  
  return (
    <div className="space-y-4">
      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Text Content</label>
        <textarea
          value={text.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent-500"
          rows={3}
        />
      </div>
      
      {/* Font Family */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Font</label>
        <select
          value={text.fontFamily || 'Arial'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          {fonts.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>
      
      {/* Font Size */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Size: {text.fontSize || 48}px</label>
        <input
          type="range"
          min="12"
          max="200"
          value={text.fontSize || 48}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>
      
      {/* Color */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={text.color || '#ffffff'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-400">{text.color || '#ffffff'}</span>
        </div>
      </div>
      
      {/* Style Buttons */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Style</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ bold: !text.bold })}
            className={`p-2 rounded-lg transition-colors ${
              text.bold ? 'bg-accent-600 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => onUpdate({ italic: !text.italic })}
            className={`p-2 rounded-lg transition-colors ${
              text.italic ? 'bg-accent-600 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => onUpdate({ underline: !text.underline })}
            className={`p-2 rounded-lg transition-colors ${
              text.underline ? 'bg-accent-600 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <Underline size={18} />
          </button>
        </div>
      </div>
      
      {/* Alignment */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Alignment</label>
        <div className="flex gap-2">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onUpdate({ align: value })}
              className={`p-2 rounded-lg transition-colors ${
                text.align === value ? 'bg-accent-600 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
      
      {/* Background Color */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Background</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={text.backgroundColor === 'transparent' ? '#000000' : text.backgroundColor}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <button
            onClick={() => onUpdate({ backgroundColor: 'transparent' })}
            className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm transition-colors"
          >
            None
          </button>
        </div>
      </div>
    </div>
  );
}

function TextAnimation({ text, onUpdate }) {
  const animations = [
    { value: 'none', label: 'None' },
    { value: 'fade-in', label: 'Fade In' },
    { value: 'slide-up', label: 'Slide Up' },
    { value: 'slide-down', label: 'Slide Down' },
    { value: 'slide-left', label: 'Slide Left' },
    { value: 'slide-right', label: 'Slide Right' },
    { value: 'zoom-in', label: 'Zoom In' },
    { value: 'zoom-out', label: 'Zoom Out' },
    { value: 'blur-in', label: 'Blur In' },
    { value: 'blur-out', label: 'Blur Out' },
  ];
  
  return (
    <div className="space-y-4">
      {/* Animation Type */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Animation</label>
        <select
          value={text.animation || 'none'}
          onChange={(e) => onUpdate({ animation: e.target.value })}
          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          {animations.map(anim => (
            <option key={anim.value} value={anim.value}>{anim.label}</option>
          ))}
        </select>
      </div>
      
      {/* Animation Speed */}
      {text.animation && text.animation !== 'none' && (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Speed: {text.animationSpeed || 1}x</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={text.animationSpeed || 1}
            onChange={(e) => onUpdate({ animationSpeed: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
      
      {/* Preview Info */}
      {text.animation && text.animation !== 'none' && (
        <div className="p-3 bg-dark-700 rounded-lg">
          <p className="text-sm text-gray-400">
            Animation will play when the text appears on the timeline.
          </p>
        </div>
      )}
    </div>
  );
}

function TextEffects({ text, onUpdate }) {
  return (
    <div className="space-y-4">
      {/* Shadow */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Shadow</label>
          <button
            onClick={() => onUpdate({ shadow: !text.shadow })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              text.shadow ? 'bg-accent-600 text-white' : 'bg-dark-700 text-gray-400'
            }`}
          >
            {text.shadow ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {text.shadow && (
          <div className="space-y-3 pl-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={text.shadowColor || '#000000'}
                onChange={(e) => onUpdate({ shadowColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-400">Color</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Offset X: {text.shadowX || 2}px</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={text.shadowX || 2}
                onChange={(e) => onUpdate({ shadowX: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Offset Y: {text.shadowY || 2}px</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={text.shadowY || 2}
                onChange={(e) => onUpdate({ shadowY: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Blur: {text.shadowBlur || 4}px</label>
              <input
                type="range"
                min="0"
                max="20"
                value={text.shadowBlur || 4}
                onChange={(e) => onUpdate({ shadowBlur: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Outline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Outline</label>
          <button
            onClick={() => onUpdate({ outline: !text.outline })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              text.outline ? 'bg-accent-600 text-white' : 'bg-dark-700 text-gray-400'
            }`}
          >
            {text.outline ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {text.outline && (
          <div className="space-y-3 pl-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={text.outlineColor || '#000000'}
                onChange={(e) => onUpdate({ outlineColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-400">Color</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Width: {text.outlineWidth || 2}px</label>
              <input
                type="range"
                min="1"
                max="10"
                value={text.outlineWidth || 2}
                onChange={(e) => onUpdate({ outlineWidth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
