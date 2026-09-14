import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

export type SnapPoint = 'peek' | 'half' | 'expanded';

interface MapBottomSheetProps {
  peekContent: React.ReactNode;
  halfContent?: React.ReactNode;
  expandedContent?: React.ReactNode;
  /** Height of the GlobalNav / bottom persistent bar, in px. Sheet sits above this. */
  bottomInset?: number;
  /** Initial snap. Default: peek */
  initialSnap?: SnapPoint;
  /** When no expandedContent exists, max sheet height is this fraction of viewport. Default 0.85 */
  expandedFraction?: number;
  /** Height of the "peek" strip in px. Default 68. */
  peekHeight?: number;
  /** Height of the "half" snap in px. Defaults to ~45% of vh minus inset. */
  halfHeight?: number;
  /** Called when snap changes. */
  onSnapChange?: (snap: SnapPoint) => void;
  /** z-index for the sheet. Sheet overlay controls must sit above the map but below detail cards. */
  zIndex?: number;
  className?: string;
}

/**
 * Google Maps / Waze style bottom sheet with three snap points.
 *
 * Layout (bottom → top):
 *  [GlobalNav / other fixed bar]  ← bottomInset
 *  ┌─ Sheet container             ← mounted absolute, fills screen.
 *  │  ┌─ Expanded content (scrollable when expanded, hidden otherwise)
 *  │  ├─ Half content (visible at half+expanded snaps)
 *  │  └─ Peek header (always visible; drag handle lives here)
 *  └─
 *
 * Drag: swipe the peek header to change snap points. Tap the peek header to
 * step between peek → half → peek (expanded requires a deliberate drag).
 */
export const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  peekContent,
  halfContent,
  expandedContent,
  bottomInset = 64,
  initialSnap = 'peek',
  expandedFraction = 0.85,
  peekHeight = 68,
  halfHeight: halfHeightProp,
  onSnapChange,
  zIndex = 40,
  className = '',
}) => {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  );

  // Re-compute snap heights whenever viewport changes (orientation, resize)
  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const availableHeight = Math.max(0, viewportHeight - bottomInset);
  const halfHeight = halfHeightProp ?? Math.max(220, availableHeight * 0.45);
  const expandedHeight = Math.max(halfHeight + 120, availableHeight * expandedFraction);

  // Height of the sheet at each snap, px.
  const snapHeights = useMemo(
    () => ({
      peek: peekHeight,
      half: halfHeight,
      expanded: expandedHeight,
    }),
    [peekHeight, halfHeight, expandedHeight],
  );

  // Convert snap → drag offset (we translate the sheet DOWN from its top.
  // At peek, the sheet is almost fully off-screen: visible = peekHeight
  // Max travel (offset): availableHeight - peekHeight
  const [snap, setSnap] = useState<SnapPoint>(initialSnap);
  const currentHeight = snapHeights[snap];

  useEffect(() => {
    // Animate to the new snap height by translating Y from the bottom.
    // Sheet top starts at bottom (availableHeight - currentHeight).
    const y = availableHeight - currentHeight;
    controls.start({ y: y, transition: { type: 'spring', stiffness: 420, damping: 38 } });
  }, [availableHeight, currentHeight, controls]);

  useEffect(() => onSnapChange?.(snap), [snap, onSnapChange]);

  // Determine next snap from a drag's final velocity + displacement.
  const computeNextSnap = useCallback(
    (offsetFromStart: number, velocityY: number): SnapPoint => {
      const order: SnapPoint[] = ['peek', 'half', 'expanded'];
      const idx = order.indexOf(snap);
      // Positive offset = sheet moved DOWN (user dragged down = go to smaller snap)
      const draggedPx = offsetFromStart;
      const thresholdPx = 48;

      if (Math.abs(velocityY) > 500) {
        // Fast flick: change by 1 level in flick direction
        const delta = velocityY > 0 ? -1 : +1;
        return order[Math.max(0, Math.min(order.length - 1, idx + delta))];
      }

      // Distance-based: count how many threshold steps we crossed
      const steps = Math.round(draggedPx / thresholdPx);
      // Negative steps = dragged UP → expand
      return order[Math.max(0, Math.min(order.length - 1, idx - steps))];
    },
    [snap],
  );

  const onDragEnd = (_: any, info: PanInfo) => {
    const next = computeNextSnap(info.offset.y, info.velocity.y);
    setSnap(next);
  };

  // Tap peek to cycle peek → half → peek (deliberate drag-up needed for expanded)
  const onPeekTap = () => {
    if (snap === 'peek') setSnap('half');
    else if (snap === 'half') setSnap('peek');
    // expanded → no-op on tap; require drag
  };

  const isAtLeastHalf = snap === 'half' || snap === 'expanded';
  const isExpanded = snap === 'expanded';
  const hasExpanded = !!expandedContent;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ zIndex }}
    >
      <motion.div
        className="pointer-events-auto absolute left-0 right-0 flex flex-col rounded-t-2xl border border-border/60 bg-card/95 backdrop-blur-2xl shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.25)]"
        style={{
          top: 0,
          height: availableHeight,
          originY: 1,
        }}
        initial={{ y: availableHeight - snapHeights[initialSnap] }}
        animate={controls}
      >
        {/* Drag handle / peek header — always the very top of the sheet */}
        <div
          className="flex-none cursor-grab active:cursor-grabbing select-none"
          onClick={onPeekTap}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Centered drag pill */}
          <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-border" />
          {/* Peek content container */}
          <div
            className="px-3 pb-2"
            style={{ height: peekHeight - 14 }}
          >
            {peekContent}
          </div>
          {/* Invisible framer-motion drag handle so swipe feels natural */}
          <motion.div
            className="absolute left-0 right-0 top-0"
            style={{ height: isExpanded ? 32 : Math.max(peekHeight, 80) }}
            drag="y"
            dragElastic={0.08}
            dragMomentum={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={onDragEnd}
          />
        </div>

        {/* Half-snap content — fades in once we pass half */}
        <motion.div
          className="flex-none overflow-hidden"
          initial={false}
          animate={{
            height: isAtLeastHalf ? 'auto' : 0,
            opacity: isAtLeastHalf ? 1 : 0,
          }}
          transition={{ duration: 0.18 }}
        >
          {halfContent ? (
            <div className="px-3 pb-2">{halfContent}</div>
          ) : null}
        </motion.div>

        {/* Expanded content — scrollable, shown only at expanded */}
        {hasExpanded ? (
          <motion.div
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide"
            initial={false}
            animate={{
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.16 }}
            style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
          >
            {expandedContent}
          </motion.div>
        ) : null}

        {/* Bottom spacer above GlobalNav */}
        <div style={{ height: bottomInset, flex: hasExpanded ? 'none' : '1 1 auto' }} />
      </motion.div>
    </div>
  );
};

export default MapBottomSheet;
