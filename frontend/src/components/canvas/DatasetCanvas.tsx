import { useRef } from 'react';
import { Stage, Layer, Circle, Text, Line } from 'react-konva';
import type Konva from 'konva';

interface Point {
  x: number;
  y: number;
  class: string;
}

const CLASS_COLORS: Record<string, string> = {
  A: '#6366f1', // indigo
  B: '#ec4899', // pink
  C: '#f59e0b', // amber
  D: '#10b981', // emerald
};

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

interface Props {
  points: Point[];
  onPointsChange: (points: Point[]) => void;
  selectedClass: string;
  onClassChange: (cls: string) => void;
}

export default function DatasetCanvas({
  points,
  onPointsChange,
  selectedClass,
  onClassChange,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);

  const handleCanvasClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    // Only add if inside canvas area
    if (point.x < 0 || point.y < 0 || point.x > CANVAS_WIDTH || point.y > CANVAS_HEIGHT) return;

    onPointsChange([...points, { x: point.x, y: point.y, class: selectedClass }]);
  };

  const handleUndo = () => {
    onPointsChange(points.slice(0, -1));
  };

  const handleClear = () => {
    onPointsChange([]);
  };

  const classList = Object.keys(CLASS_COLORS);

  return (
    <div className="space-y-4">
      {/* Class selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Class:</span>
        {classList.map((cls) => (
          <button
            key={cls}
            onClick={() => onClassChange(cls)}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition border-2 ${
              selectedClass === cls
                ? `border-${CLASS_COLORS[cls]} bg-${CLASS_COLORS[cls]}/10 text-${CLASS_COLORS[cls]}`
                : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
            style={{
              borderColor: selectedClass === cls ? CLASS_COLORS[cls] : undefined,
              color: selectedClass === cls ? CLASS_COLORS[cls] : undefined,
              backgroundColor: selectedClass === cls ? `${CLASS_COLORS[cls]}20` : undefined,
            }}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          ref={stageRef}
          className="cursor-crosshair"
        >
          <Layer>
            {/* Grid (optional) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Line
                key={`grid-v-${i}`}
                points={[i * 100, 0, i * 100, CANVAS_HEIGHT]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
                dash={[4, 4]}
              />
            ))}
            {Array.from({ length: 4 }).map((_, i) => (
              <Line
                key={`grid-h-${i}`}
                points={[0, i * 100, CANVAS_WIDTH, i * 100]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
                dash={[4, 4]}
              />
            ))}
            {/* Points */}
            {points.map((p, i) => (
              <Circle
                key={i}
                x={p.x}
                y={p.y}
                radius={6}
                fill={CLASS_COLORS[p.class] || '#6b7280'}
                stroke="#fff"
                strokeWidth={1.5}
                shadowColor="#000"
                shadowBlur={3}
              />
            ))}
            {/* Axis labels */}
            <Text x={10} y={CANVAS_HEIGHT - 20} text="Feature 1" fontSize={11} fill="#9ca3af" />
            <Text
              x={CANVAS_WIDTH - 50}
              y={10}
              text="Feature 2"
              fontSize={11}
              fill="#9ca3af"
              rotation={-90}
            />
          </Layer>
        </Stage>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleUndo}
          disabled={points.length === 0}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Undo
        </button>
        <button
          onClick={handleClear}
          disabled={points.length === 0}
          className="px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg disabled:opacity-40 hover:bg-red-200 dark:hover:bg-red-900/40 transition"
        >
          Clear All
        </button>
        <span className="ml-auto text-sm text-gray-500 self-center">{points.length} points</span>
      </div>
    </div>
  );
}
