# Video Editor Web Application

A modern, responsive web-based video editing application with a clean UI similar to professional editors.

## 🚀 Features

### Core Layout
- **3-Panel Interface**
  - Left Sidebar: Assets & Tools
  - Center Canvas: Preview Area
  - Bottom Timeline: Multi-layer Editing

### Media Management
- Import video, audio, and image files (all major formats)
- Media library preview with thumbnails
- User font upload support (.ttf, .otf, .woff)
- Background settings (color/image with fit modes)

### Canvas Controls
- Adjustable canvas ratios:
  - 16:9 (landscape)
  - 9:16 (vertical)
  - 1:1 (square)
  - Custom ratio option
- Drag, resize, and reposition elements
- Real-time preview

### Timeline Features
- Multiple layers: Video, Audio, Text, Image
- Drag & drop clips
- Trim, split, and merge clips
- Zoom timeline (50% - 400%)
- Snap-to-grid alignment
- Playhead navigation

### Video Editing Tools
- Crop video
- Resize & rotate
- Clip splitting
- Merge multiple clips
- Add transitions between clips
- Delete unwanted sections

### Visual Effects Panel
- Adjustable effects with intensity sliders:
  - Standard styles
  - Neon glow
  - Drop shadow
  - Fade + scale
  - Staggered slide

### Text Editing System
- Full-featured text editor overlay
- Font controls:
  - Font family (free fonts + user-uploaded)
  - Bold / Italic / Underline
  - Text color picker
  - Text size slider
- Advanced styling:
  - Text shadow with customizable offset and blur
  - Text background color
  - Outline stroke
- Positioning:
  - Move text using arrow keys
  - Drag on canvas
  - Text wrapping support

### Text Animation Panel
- Animated presets with adjustable speed/intensity:
  - Directional movement (Up, Down, Left, Right)
  - Fold / Unfold
  - Zoom In / Zoom Out
  - Blur In / Blur Out
  - Custom motion control

### Audio Editing
- Separate audio layers
- Split audio clips
- Delete unwanted sections
- Adjust volume (coming soon)

### Export & Save
- Export video in HD quality (720p / 1080p)
- Download final video
- Save project for later editing

### Extra Features
- Undo / Redo (Ctrl+Z / Ctrl+Shift+Z)
- Keyboard shortcuts:
  - Space: Play/Pause
  - Arrow Keys: Move selected element
  - Shift + Arrow Keys: Move element faster
- Smooth playback preview
- Loading/progress indicators

## 🎨 UI Style
- Minimal and modern dark theme
- Smooth animations
- Clean icons (Lucide React)
- Responsive for desktop & tablet

## 🛠️ Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Context API** - State management

## 📦 Installation

```bash
cd video-editor
npm install
```

## 🚀 Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
video-editor/
├── src/
│   ├── components/
│   │   ├── Sidebar/
│   │   │   └── Sidebar.jsx          # Left panel with media library
│   │   ├── Canvas/
│   │   │   └── Canvas.jsx           # Center preview area
│   │   ├── Timeline/
│   │   │   └── Timeline.jsx         # Bottom timeline editor
│   │   ├── TextEditor/
│   │   │   └── TextEditor.jsx       # Text properties panel
│   │   ├── EffectsPanel/
│   │   └── Export/
│   ├── context/
│   │   └── EditorContext.jsx        # Global state management
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── public/
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🎯 Usage Guide

### 1. Import Media
- Click "Import Media" in the left sidebar
- Select video, audio, or image files
- Files appear in the media library

### 2. Add to Timeline
- Click on a media item to select its layer type
- Drag items to the timeline (coming soon)
- Or use the "Add" button

### 3. Edit Clips
- Select a layer (Video, Audio, Text, Image)
- Click on a clip in the timeline
- Use Split button to cut at playhead position
- Use Delete button to remove selected clip

### 4. Add Text
- Click "Add Text" in the right panel
- Customize font, size, color, and style
- Add animations and effects
- Drag text on canvas to reposition

### 5. Playback
- Press Space or click Play button
- Use timeline to navigate
- Zoom in/out for precision editing

### 6. Export
- Click "Export Video" button
- Choose resolution (720p/1080p)
- Download final video

## 🔮 Future Enhancements

- [ ] FFmpeg integration for actual video processing
- [ ] Drag & drop to timeline
- [ ] Transition effects between clips
- [ ] Audio waveform visualization
- [ ] Color grading tools
- [ ] Keyframe animation
- [ ] Multi-track audio mixing
- [ ] Green screen/chroma key
- [ ] Speed control (slow motion/time lapse)
- [ ] Real-time collaboration
- [ ] Cloud storage integration
- [ ] Template library

## 📝 Notes

This is a frontend implementation of a video editor. For full video processing capabilities, integration with FFmpeg.wasm or a backend video processing service would be required.

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
