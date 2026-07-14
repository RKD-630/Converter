import { useState, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Upload, FileVideo, FileAudio, Image, Music, Trash2, Type } from 'lucide-react';

export function Sidebar() {
  const { state, addAsset, addFont, selectLayer } = useEditor();
  const [activeTab, setActiveTab] = useState('media');
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 
                   file.type.startsWith('audio/') ? 'audio' : 'image';
      
      const asset = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type,
        url,
        file,
        duration: type === 'video' || type === 'audio' ? 0 : null,
      };
      
      addAsset(asset);
    });
    
    e.target.value = '';
  };

  const handleFontUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.name.endsWith('.ttf') || file.name.endsWith('.otf') || file.name.endsWith('.woff')) {
        const url = URL.createObjectURL(file);
        const fontFace = new FontFace(file.name.replace(/\.[^/.]+$/, ''), `url(${url})`);
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
          addFont({
            id: `font-${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            url,
          });
        });
      }
    });
    
    e.target.value = '';
  };

  const addToTimeline = (asset) => {
    const layer = asset.type === 'video' ? 'video' : 
                  asset.type === 'audio' ? 'audio' : 'image';
    
    const item = {
      id: `${layer}-item-${Date.now()}`,
      assetId: asset.id,
      name: asset.name,
      url: asset.url,
      startTime: state.currentTime,
      duration: asset.duration || 5,
      trimStart: 0,
      trimEnd: asset.duration || 5,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    };
    
    // For video/audio, we'd need to get actual duration
    if (asset.type === 'video' || asset.type === 'audio') {
      const media = document.createElement(asset.type === 'video' ? 'video' : 'audio');
      media.src = asset.url;
      media.onloadedmetadata = () => {
        item.duration = media.duration;
        item.trimEnd = media.duration;
        // This is a simplified version - in production you'd update the state properly
      };
    }
    
    // For now, add with placeholder duration
    const { addLayerItem } = useEditor.getState(); // This won't work, need to fix
  };

  return (
    <div className="w-72 bg-dark-800 border-r border-dark-600 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-dark-600">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'media' 
              ? 'bg-dark-700 text-accent-500 border-b-2 border-accent-500' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          Media
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'fonts' 
              ? 'bg-dark-700 text-accent-500 border-b-2 border-accent-500' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          Fonts
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'background' 
              ? 'bg-dark-700 text-accent-500 border-b-2 border-accent-500' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          BG
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'media' && (
          <div className="space-y-4">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-600 hover:bg-accent-700 rounded-lg text-white font-medium transition-colors"
            >
              <Upload size={18} />
              Import Media
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*,image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Media Library */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Library ({state.assets.length})
              </h3>
              
              {state.assets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No media imported yet
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {state.assets.map(asset => (
                    <div
                      key={asset.id}
                      className="group relative aspect-square bg-dark-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent-500 transition-all"
                      onClick={() => {
                        selectLayer(asset.type === 'video' ? 'video' : asset.type === 'audio' ? 'audio' : 'image');
                      }}
                    >
                      {asset.type === 'video' && (
                        <>
                          <video src={asset.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <FileVideo className="text-white" size={24} />
                          </div>
                        </>
                      )}
                      {asset.type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-dark-600">
                          <Music className="text-gray-400" size={32} />
                        </div>
                      )}
                      {asset.type === 'image' && (
                        <>
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Image className="text-white" size={24} />
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white truncate">{asset.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="space-y-4">
            <button
              onClick={() => fontInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-600 hover:bg-accent-700 rounded-lg text-white font-medium transition-colors"
            >
              <Upload size={18} />
              Upload Font
            </button>
            <input
              ref={fontInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFontUpload}
              className="hidden"
            />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Available Fonts
              </h3>
              
              <div className="space-y-1">
                {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact']
                  .concat(state.fonts.map(f => f.name))
                  .map(font => (
                    <div
                      key={font}
                      className="px-3 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 cursor-pointer transition-colors"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <BackgroundSettings />
        )}
      </div>
    </div>
  );
}

function BackgroundSettings() {
  const { state, setBackground } = useEditor();
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Background Color
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={state.backgroundColor}
            onChange={(e) => setBackground(e.target.value, null, state.backgroundFit)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-400">{state.backgroundColor}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Fit Mode
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setBackground(state.backgroundColor, state.backgroundImage, 'cover')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              state.backgroundFit === 'cover'
                ? 'bg-accent-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            Cover
          </button>
          <button
            onClick={() => setBackground(state.backgroundColor, state.backgroundImage, 'contain')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              state.backgroundFit === 'contain'
                ? 'bg-accent-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            Contain
          </button>
        </div>
      </div>
    </div>
  );
}
