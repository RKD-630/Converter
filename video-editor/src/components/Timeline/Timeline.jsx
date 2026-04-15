import { useState, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Play, Pause, SkipBack, SkipForward, Scissors, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

export function Timeline() {
  const { 
    state, 
    setPlaying, 
    setCurrentTime, 
    setDuration,
    setTimelineZoom,
    selectLayer,
    selectedLayer,
    splitClip,
    removeLayerItem,
  } = useEditor();
  
  const timelineRef = useRef(null);
  const [hoveredTrack, setHoveredTrack] = useState(null);
  
  const layerOrder = ['video', 'audio', 'text', 'image'];
  const trackHeight = 60;
  const pixelsPerSecond = 50 * state.timelineZoom;
  
  // Calculate total timeline duration
  const totalDuration = Math.max(
    30, // Minimum 30 seconds
    ...Object.values(state.layers).flat().map(item => item.startTime + item.duration)
  );
  
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 200; // Account for track labels
    const time = Math.max(0, x / pixelsPerSecond);
    setCurrentTime(time);
  };
  
  const handlePlayPause = () => {
    setPlaying(!state.isPlaying);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  const handleSplit = () => {
    if (selectedLayer && state.layers[selectedLayer].length > 0) {
      // Find clip at current time
      const clip = state.layers[selectedLayer].find(
        item => state.currentTime >= item.startTime && state.currentTime < item.startTime + item.duration
      );
      
      if (clip) {
        splitClip(selectedLayer, clip.id, state.currentTime);
      }
    }
  };
  
  const handleDelete = () => {
    if (selectedLayer && state.layers[selectedLayer].length > 0) {
      const clip = state.layers[selectedLayer].find(
        item => state.currentTime >= item.startTime && state.currentTime < item.startTime + item.duration
      );
      
      if (clip) {
        removeLayerItem(selectedLayer, clip.id);
      }
    }
  };

  return (
    <div className="h-72 bg-dark-800 border-t border-dark-600 flex flex-col">
      {/* Timeline Controls */}
      <div className="h-12 border-b border-dark-600 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTime(Math.max(0, state.currentTime - 5))}
            className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <SkipBack size={18} className="text-gray-400" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-2 bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors"
          >
            {state.isPlaying ? (
              <Pause size={18} className="text-white" />
            ) : (
              <Play size={18} className="text-white" />
            )}
          </button>
          
          <button
            onClick={() => setCurrentTime(state.currentTime + 5)}
            className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <SkipForward size={18} className="text-gray-400" />
          </button>
          
          <div className="ml-4 px-3 py-1 bg-dark-700 rounded text-sm font-mono text-accent-500">
            {formatTime(state.currentTime)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSplit}
            disabled={!selectedLayer}
            className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            <Scissors size={16} />
            Split
          </button>
          
          <button
            onClick={handleDelete}
            disabled={!selectedLayer}
            className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
          
          <div className="w-px h-6 bg-dark-600 mx-2" />
          
          <button
            onClick={() => setTimelineZoom(Math.max(0.5, state.timelineZoom - 0.25))}
            className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <ZoomOut size={16} className="text-gray-400" />
          </button>
          
          <span className="text-sm text-gray-400 w-12 text-center">
            {Math.round(state.timelineZoom * 100)}%
          </span>
          
          <button
            onClick={() => setTimelineZoom(Math.min(4, state.timelineZoom + 0.25))}
            className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <ZoomIn size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Timeline Tracks */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        onClick={handleTimelineClick}
      >
        <div 
          className="relative"
          style={{ 
            width: Math.max(800, totalDuration * pixelsPerSecond + 200),
            height: layerOrder.length * trackHeight,
          }}
        >
          {/* Time Ruler */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-dark-700 border-b border-dark-600 flex">
            <div className="w-48 flex-shrink-0 border-r border-dark-600" />
            <div className="flex-1 relative">
              {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-dark-500 text-xs text-gray-500 pl-1"
                  style={{ left: i * 5 * pixelsPerSecond }}
                >
                  {formatTime(i * 5)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Playhead */}
          <div
            className="absolute top-6 bottom-0 w-px bg-accent-500 z-20 pointer-events-none"
            style={{ left: 200 + state.currentTime * pixelsPerSecond }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-accent-500 transform rotate-45" />
          </div>
          
          {/* Tracks */}
          {layerOrder.map((layerType, index) => (
            <TimelineTrack
              key={layerType}
              layerType={layerType}
              layerIndex={index}
              trackHeight={trackHeight}
              pixelsPerSecond={pixelsPerSecond}
              hoveredTrack={hoveredTrack}
              setHoveredTrack={setHoveredTrack}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineTrack({ layerType, layerIndex, trackHeight, pixelsPerSecond, hoveredTrack, setHoveredTrack }) {
  const { state, selectLayer, selectedLayer } = useEditor();
  const items = state.layers[layerType] || [];
  
  const layerLabels = {
    video: '📹 Video',
    audio: '🎵 Audio',
    text: '✍️ Text',
    image: '🖼️ Image',
  };
  
  const isSelected = selectedLayer === layerType;
  
  return (
    <div
      className="absolute left-0 right-0 border-b border-dark-600 flex"
      style={{ 
        top: 24 + layerIndex * trackHeight,
        height: trackHeight,
      }}
      onMouseEnter={() => setHoveredTrack(layerType)}
      onMouseLeave={() => setHoveredTrack(null)}
      onClick={(e) => {
        e.stopPropagation();
        selectLayer(layerType);
      }}
    >
      {/* Track Label */}
      <div 
        className={`w-48 flex-shrink-0 flex items-center px-3 border-r border-dark-600 ${
          isSelected ? 'bg-accent-900/30' : 'bg-dark-700'
        }`}
      >
        <span className="text-sm font-medium text-gray-300">{layerLabels[layerType]}</span>
      </div>
      
      {/* Track Content */}
      <div className="flex-1 relative bg-dark-750">
        {items.map(item => (
          <TimelineClip
            key={item.id}
            item={item}
            pixelsPerSecond={pixelsPerSecond}
            trackHeight={trackHeight}
            isSelected={isSelected}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineClip({ item, pixelsPerSecond, trackHeight, isSelected }) {
  const width = item.duration * pixelsPerSecond;
  
  const getClipColor = () => {
    switch (item.layerType || 'video') {
      case 'video': return 'bg-blue-600 hover:bg-blue-500';
      case 'audio': return 'bg-green-600 hover:bg-green-500';
      case 'text': return 'bg-purple-600 hover:bg-purple-500';
      case 'image': return 'bg-orange-600 hover:bg-orange-500';
      default: return 'bg-gray-600 hover:bg-gray-500';
    }
  };
  
  return (
    <div
      className={`absolute top-1 bottom-1 rounded-md ${getClipColor()} ${
        isSelected ? 'ring-2 ring-accent-500' : ''
      } cursor-pointer transition-all overflow-hidden`}
      style={{
        left: item.startTime * pixelsPerSecond,
        width: Math.max(width - 2, 10),
      }}
    >
      <div className="px-2 py-1 text-xs text-white truncate">{item.name || 'Clip'}</div>
      {width > 60 && (
        <div className="px-2 text-xs text-white/70">
          {item.duration.toFixed(1)}s
        </div>
      )}
    </div>
  );
}
