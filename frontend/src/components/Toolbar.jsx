const Toolbar = ({ selectedTool, setSelectedTool, selectedColor, setSelectedColor, brushSize, setBrushSize, onClear, onDownload }) => {
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Tools */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTool('pen')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedTool === 'pen'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setSelectedTool('eraser')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedTool === 'eraser'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🧹 Eraser
          </button>
        </div>

        {/* Brush/Eraser Size Slider */}
        <div className="flex items-center gap-3 border-l border-gray-300 pl-6">
          <label className="text-gray-700 font-semibold">
            {selectedTool === 'pen' ? 'Brush' : 'Eraser'} Size:
          </label>
          <input
            type="range"
            min="1"
            max={selectedTool === 'eraser' ? 50 : 20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div 
            className="rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold"
            style={{ 
              width: `${Math.max(24, Math.min(brushSize * 1.5, 40))}px`, 
              height: `${Math.max(24, Math.min(brushSize * 1.5, 40))}px` 
            }}
          >
            {brushSize}
          </div>
        </div>

        {/* Colors (Only show for Pen) */}
        {selectedTool === 'pen' && (
          <div className="flex items-center gap-3 border-l border-gray-300 pl-6">
            <label className="text-gray-700 font-semibold">Color:</label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${
                    selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: color === '#FFFFFF' ? '0 0 0 1px #e5e7eb inset' : 'none'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clear Button */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={onDownload}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2"
          >
            💾 Download
          </button>
          <button
            onClick={onClear}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;