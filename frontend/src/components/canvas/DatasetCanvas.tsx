import { useState, useRef } from 'react';
import { Stage, Layer, Circle, Text, Line, Rect } from 'react-konva';
import type Konva from 'konva';

// ----- Types -----
interface Point {
  x: number;
  y: number;
  class: string;
}

// Class colors
const CLASS_COLORS: Record<string, string> = {
  A: '#6366f1', // indigo
  B: '#ec4899', // pink
  C: '#f59e0b', // amber
  D: '#10b981', // emerald
  E: '#8b5cf6', // violet
};

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 380;
const POINT_RADIUS = 7;

interface Props {
  points: Point[];
  onPointsChange: (points: Point[]) => void;
  selectedClass: string;
  onClassChange: (cls: string) => void;
}

// ----- Component -----
export default function DatasetCanvas({
  points,
  onPointsChange,
  selectedClass,
  onClassChange,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleCanvasClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;
    // Clamp inside canvas boundaries with a small margin
    const x = Math.max(POINT_RADIUS, Math.min(point.x, CANVAS_WIDTH - POINT_RADIUS));
    const y = Math.max(POINT_RADIUS, Math.min(point.y, CANVAS_HEIGHT - POINT_RADIUS));
    onPointsChange([...points, { x, y, class: selectedClass }]);
  };

  const handleUndo = () => onPointsChange(points.slice(0, -1));
  const handleClear = () => onPointsChange([]);

  // ----- Tooltip for empty state -----
  const hasPoints = points.length > 0;

  // ----- Grid lines (reusable) -----
  const gridLines = [];
  const step = 40;
  for (let i = step; i < CANVAS_WIDTH; i += step) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, CANVAS_HEIGHT]}
        stroke="#e0e7ff"
        strokeWidth={0.5}
        dash={[4, 6]}
      />
    );
  }
  for (let j = step; j < CANVAS_HEIGHT; j += step) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, j, CANVAS_WIDTH, j]}
        stroke="#e0e7ff"
        strokeWidth={0.5}
        dash={[4, 6]}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Class selector – styled as pill buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-1">Class:</span>
        {Object.keys(CLASS_COLORS).map((cls) => (
          <button
            key={cls}
            type="button"
            onClick={() => onClassChange(cls)}
            className="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2"
            style={{
              borderColor: selectedClass === cls ? CLASS_COLORS[cls] : 'transparent',
              backgroundColor: selectedClass === cls ? `${CLASS_COLORS[cls]}1a` : 'transparent',
              color: selectedClass === cls ? CLASS_COLORS[cls] : '#6b7280',
              boxShadow: selectedClass === cls ? `0 0 0 2px ${CLASS_COLORS[cls]}40` : 'none',
            }}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900"
        style={{ maxWidth: CANVAS_WIDTH + 2 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          ref={stageRef}
          style={{ cursor: 'crosshair', display: 'block' }}
        >
          {/* Background gradient */}
          <Layer>
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: CANVAS_WIDTH, y: CANVAS_HEIGHT }}
              fillLinearGradientColorStops={[0, '#f9fafb', 1, '#f3f4f6']}
            />
            {gridLines}
          </Layer>

          {/* Points and labels */}
          <Layer>
            {!hasPoints && (
              <Text
                x={CANVAS_WIDTH / 2 - 80}
                y={CANVAS_HEIGHT / 2 - 10}
                text="Click to add a point"
                fontSize={14}
                fill="#9ca3af"
                fontStyle="italic"
              />
            )}
            {points.map((p, i) => (
              <Circle
                key={i}
                x={p.x}
                y={p.y}
                radius={POINT_RADIUS}
                fill={CLASS_COLORS[p.class] || '#6b7280'}
                stroke="#ffffff"
                strokeWidth={2}
                shadowColor="rgba(0,0,0,0.15)"
                shadowBlur={4}
                shadowOffset={{ x: 0, y: 2 }}
              />
            ))}
          </Layer>

          {/* Axes subtle labels */}
          <Layer>
            <Text
              x={12}
              y={CANVAS_HEIGHT - 18}
              text="Feature 1 →"
              fontSize={11}
              fill="#9ca3af"
              fontStyle="italic"
            />
            <Text
              x={CANVAS_WIDTH - 58}
              y={10}
              text="Feature 2 →"
              fontSize={11}
              fill="#9ca3af"
              fontStyle="italic"
              rotation={-90}
            />
          </Layer>
        </Stage>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUndo}
          disabled={!hasPoints}
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Undo
        </button>
        <button
          onClick={handleClear}
          disabled={!hasPoints}
          className="flex items-center gap-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-100 dark:hover:bg-red-900/30 transition text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear
        </button>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          {points.length} point{points.length !== 1 && 's'}
        </div>
      </div>
    </div>
  );
}
