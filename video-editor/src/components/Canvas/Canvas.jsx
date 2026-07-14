import { useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { motion } from 'framer-motion';
import { Type, Image, GripVertical } from 'lucide-react';

export function Canvas() {
  const { state, setCanvasRatio, selectElement, selectedElement, updateLayerItem } = useEditor();
  const canvasContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getCanvasDimensions = () => {
    const containerWidth = canvasContainerRef.current?.clientWidth || 800;
    const containerHeight = canvasContainerRef.current?.clientHeight || 450;
    
    let width, height;
    switch (state.canvasRatio) {
      case '16:9':
        width = 1920;
        height = 1080;
        break;
      case '9:16':
        width = 1080;
        height = 1920;
        break;
      case '1:1':
        width = 1080;
        height = 1080;
        break;
      default:
        width = state.canvasWidth;
        height = state.canvasHeight;
    }
    
    // Scale to fit container
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    return {
      width: width * scale,
      height: height * scale,
      originalWidth: width,
      originalHeight: height,
      scale,
    };
  };

  const dims = getCanvasDimensions();

  const handleElementMouseDown = (e, element) => {
    e.stopPropagation();
    selectElement(element);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.position?.x || 0,
      y: e.clientY - element.position?.y || 0,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement) return;
    
    const newX = (e.clientX - dragStart.x) / dims.scale;
    const newY = (e.clientY - dragStart.y) / dims.scale;
    
    const layer = selectedElement.layerType;
    updateLayerItem(layer, selectedElement.id, {
      position: { x: newX, y: newY },
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e) => {
    if (!selectedElement) return;
    
    const step = e.shiftKey ? 10 : 1;
    let newX = selectedElement.position?.x || 0;
    let newY = selectedElement.position?.y || 0;
    
    switch (e.key) {
      case 'ArrowUp':
        newY -= step;
        break;
      case 'ArrowDown':
        newY += step;
        break;
      case 'ArrowLeft':
        newX -= step;
        break;
      case 'ArrowRight':
        newX += step;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    updateLayerItem(selectedElement.layerType, selectedElement.id, {
      position: { x: newX, y: newY },
    });
  };

  return (
    <div 
      className="flex-1 bg-dark-900 flex flex-col overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Canvas Ratio Controls */}
      <div className="h-12 border-b border-dark-600 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Canvas:</span>
          <div className="flex gap-1">
            {[
              { ratio: '16:9', label: '16:9' },
              { ratio: '9:16', label: '9:16' },
              { ratio: '1:1', label: '1:1' },
            ].map(({ ratio, label }) => (
              <button
                key={ratio}
                onClick={() => setCanvasRatio(ratio)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  state.canvasRatio === ratio
                    ? 'bg-accent-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {dims.originalWidth} × {dims.originalHeight}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative shadow-2xl"
          style={{
            width: dims.width,
            height: dims.height,
            backgroundColor: state.backgroundColor,
            backgroundImage: state.backgroundImage ? `url(${state.backgroundImage})` : undefined,
            backgroundSize: state.backgroundFit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          onClick={() => selectElement(null)}
        >
          {/* Render all visible elements at current time */}
          {Object.entries(state.layers).flatMap(([layerType, items]) =>
            items.filter(item => 
              state.currentTime >= item.startTime && 
              state.currentTime < item.startTime + item.duration
            ).map(item => (
              <CanvasElement
                key={item.id}
                item={item}
                layerType={layerType}
                isSelected={selectedElement?.id === item.id}
                onMouseDown={(e) => handleElementMouseDown(e, { ...item, layerType })}
                scale={dims.scale}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasElement({ item, layerType, isSelected, onMouseDown, scale }) {
  const { updateLayerItem } = useEditor();

  const baseStyle = {
    position: 'absolute',
    left: item.position?.x || 0,
    top: item.position?.y || 0,
    transform: `scale(${item.scale || 1}) rotate(${item.rotation || 0}deg)`,
    cursor: 'move',
  };

  if (isSelected) {
    return (
      <>
        <div
          {...baseStyle}
          className="ring-2 ring-accent-500"
          onMouseDown={onMouseDown}
        >
          {layerType === 'video' && (
            <video 
              src={item.url} 
              className="max-w-full max-h-full pointer-events-none"
              muted
            />
          )}
          {layerType === 'image' && (
            <img 
              src={item.url} 
              alt={item.name}
              className="max-w-full max-h-full pointer-events-none"
            />
          )}
          {layerType === 'text' && (
            <TextDisplay text={item} />
          )}
        </div>
        
        {/* Resize handles could be added here */}
      </>
    );
  }

  return (
    <div {...baseStyle} onMouseDown={onMouseDown}>
      {layerType === 'video' && (
        <video 
          src={item.url} 
          className="max-w-full max-h-full pointer-events-none"
          muted
        />
      )}
      {layerType === 'image' && (
        <img 
          src={item.url} 
          alt={item.name}
          className="max-w-full max-h-full pointer-events-none"
        />
      )}
      {layerType === 'text' && (
        <TextDisplay text={item} />
      )}
    </div>
  );
}

function TextDisplay({ text }) {
  const style = {
    fontSize: text.fontSize || 48,
    fontFamily: text.fontFamily || 'Arial',
    fontWeight: text.bold ? 'bold' : 'normal',
    fontStyle: text.italic ? 'italic' : 'normal',
    textDecoration: text.underline ? 'underline' : 'none',
    color: text.color || '#ffffff',
    textAlign: text.align || 'left',
    textShadow: text.shadow ? `${text.shadowX || 2}px ${text.shadowY || 2}px ${text.shadowBlur || 4}px ${text.shadowColor || '#000000'}` : 'none',
    WebkitTextStroke: text.outline ? `${text.outlineWidth || 2}px ${text.outlineColor || '#000000'}` : 'none',
    backgroundColor: text.backgroundColor || 'transparent',
    padding: text.backgroundColor ? '8px' : '0',
    borderRadius: text.backgroundColor ? '4px' : '0',
  };

  return (
    <div style={style}>
      {text.content || 'Sample Text'}
    </div>
  );
}
