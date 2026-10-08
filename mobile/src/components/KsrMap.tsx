import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  PanResponder,
  GestureResponderEvent
} from 'react-native';
import Svg, {
  SvgXml,
  Rect,
  Circle,
  Path,
  G,
  Text as SvgText,
  Polyline,
  Line,
  Defs,
  LinearGradient,
  Stop
} from 'react-native-svg';
import { Coordinates } from '../services/localRouter';
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';
import { useBlockageStore } from '../store/blockageStore';
import { KSR_STATION_SVG_STRING } from '../data/station/ksrStationSvg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = 3456;
const MAP_HEIGHT = 1728;
const ASPECT_RATIO = MAP_HEIGHT / MAP_WIDTH; // 0.5 (2:1 ratio)

// Memoized Base Station CAD Vector Layer from ksrsvg.svg
const BaseStationMap = React.memo(() => {
  return (
    <SvgXml
      xml={KSR_STATION_SVG_STRING}
      width="100%"
      height="100%"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    />
  );
});

interface KsrMapProps {
  routeCoordinates?: Coordinates[];
  currentLocation?: Coordinates;
  destinationLocation?: Coordinates;
  onSelectPlatform?: (platform: any) => void;
  onSelectFacility?: (facility: any) => void;
  onSelectMapCoordinate?: (coords: Coordinates) => void;
  selectionMode?: 'none' | 'source' | 'destination';
  onCancelSelection?: () => void;
  showFacilities?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const KsrMap: React.FC<KsrMapProps> = ({
  routeCoordinates,
  currentLocation,
  destinationLocation,
  onSelectPlatform,
  onSelectFacility,
  onSelectMapCoordinate,
  selectionMode = 'none',
  onCancelSelection,
  showFacilities = true,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorCoord, setCursorCoord] = useState<Coordinates | null>(null);

  const blockageStatuses = useBlockageStore((state) => state.statuses);

  // Compute container dimensions
  const containerWidth = isFullscreen ? SCREEN_WIDTH : SCREEN_WIDTH - 24;
  const containerHeight = isFullscreen
    ? Dimensions.get('window').height - 120
    : Math.max(280, containerWidth * ASPECT_RATIO + 40);

  // Base rendered dimensions maintaining exact 2:1 aspect ratio
  const baseScale = Math.min(containerWidth / MAP_WIDTH, (containerHeight - 40) / MAP_HEIGHT);
  const baseWidth = MAP_WIDTH * baseScale;
  const baseHeight = MAP_HEIGHT * baseScale;

  const renderedWidth = baseWidth * zoomLevel;
  const renderedHeight = baseHeight * zoomLevel;

  // Render origin relative to container
  const originX = (containerWidth - renderedWidth) / 2 + panOffset.x;
  const originY = (containerHeight - renderedHeight) / 2 + panOffset.y;

  // Zoom and pan controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z * 1.35, 4.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z / 1.35, 0.75));

  const handleCenter = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFitRoute = useCallback(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      handleReset();
      return;
    }
    const xs = routeCoordinates.map((c) => c.x);
    const ys = routeCoordinates.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const routeWidth = Math.max(maxX - minX, 400);
    const routeHeight = Math.max(maxY - minY, 250);

    const targetZoom = Math.min(
      (MAP_WIDTH / routeWidth) * 0.65,
      (MAP_HEIGHT / routeHeight) * 0.65,
      3.2
    );

    const midSvgX = (minX + maxX) / 2;
    const midSvgY = (minY + maxY) / 2;

    // Shift mid point to viewport center
    const targetScale = baseScale * targetZoom;
    const offsetX = (MAP_WIDTH / 2 - midSvgX) * targetScale;
    const offsetY = (MAP_HEIGHT / 2 - midSvgY) * targetScale;

    setZoomLevel(Math.max(1.2, targetZoom));
    setPanOffset({ x: offsetX, y: offsetY });
  }, [routeCoordinates, baseScale]);

  // Convert touch event to SVG coordinates (0 to 3456, 0 to 1728)
  const screenToSvgCoords = useCallback(
    (screenX: number, screenY: number): Coordinates => {
      const relX = screenX - originX;
      const relY = screenY - originY;
      const svgX = Math.max(0, Math.min(MAP_WIDTH, (relX / renderedWidth) * MAP_WIDTH));
      const svgY = Math.max(0, Math.min(MAP_HEIGHT, (relY / renderedHeight) * MAP_HEIGHT));
      return { x: Math.round(svgX), y: Math.round(svgY) };
    },
    [originX, originY, renderedWidth, renderedHeight]
  );

  // PanResponder to handle smooth dragging and taps
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0
  });
  const touchDistanceRef = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: (evt, _) => {
        const { pageX, pageY } = evt.nativeEvent;
        dragStartRef.current = {
          x: pageX,
          y: pageY,
          panX: panOffset.x,
          panY: panOffset.y
        };
        touchDistanceRef.current = null;
      },
      onPanResponderMove: (evt, gesture) => {
        // Pinch zoom detection for multi-touch
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length >= 2) {
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          const dist = Math.sqrt((t1.pageX - t2.pageX) ** 2 + (t1.pageY - t2.pageY) ** 2);
          if (touchDistanceRef.current !== null) {
            const factor = dist / touchDistanceRef.current;
            setZoomLevel((z) => Math.max(0.75, Math.min(4.5, z * factor)));
          }
          touchDistanceRef.current = dist;
          return;
        }

        // Single touch drag / pan
        setPanOffset({
          x: dragStartRef.current.panX + gesture.dx,
          y: dragStartRef.current.panY + gesture.dy
        });
      },
      onPanResponderRelease: (evt, gesture) => {
        // If movement was negligible (< 6px), treat as tap
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
          const { locationX, locationY } = evt.nativeEvent;
          const svgCoords = screenToSvgCoords(locationX, locationY);
          setCursorCoord(svgCoords);

          if (onSelectMapCoordinate && selectionMode !== 'none') {
            onSelectMapCoordinate(svgCoords);
          }
        }
      }
    })
  ).current;

  // Route Polyline Points string
  const polylinePoints = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) return '';
    return routeCoordinates.map((c) => `${c.x},${c.y}`).join(' ');
  }, [routeCoordinates]);

  // Marker visibility based on zoom level to prevent clutter (Section 25)
  const isDetailedZoom = zoomLevel >= 1.25;

  return (
    <View style={[styles.cardContainer, isFullscreen && styles.fullscreenContainer]}>
      {/* Map Header Status & Mode Banner */}
      <View style={styles.topBar}>
        <View style={styles.titleInfo}>
          <Text style={styles.titleText}>KSR BENGALURU STATION MAP</Text>
          <Text style={styles.cadBadge}>ORIGINAL CAD VECTOR • VIEWBOX 3456×1728</Text>
        </View>

        <View style={styles.topRightActions}>
          {onToggleFullscreen && (
            <TouchableOpacity onPress={onToggleFullscreen} style={styles.fullscreenBtn} activeOpacity={0.8}>
              <Text style={styles.fullscreenBtnText}>{isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mode Guidance Alert (Section 12 & 13) */}
      {selectionMode !== 'none' && (
        <View style={styles.selectionModeBanner}>
          <View style={styles.selectionModeLeft}>
            <Text style={styles.selectionModeIcon}>
              {selectionMode === 'source' ? '📍' : '🎯'}
            </Text>
            <View>
              <Text style={styles.selectionModeTitle}>
                {selectionMode === 'source' ? 'SELECT STARTING POINT' : 'SELECT DESTINATION'}
              </Text>
              <Text style={styles.selectionModeSub}>
                {selectionMode === 'source'
                  ? 'Tap your starting location on the KSR map.'
                  : 'Tap your destination on the KSR map.'}
              </Text>
            </View>
          </View>
          {onCancelSelection && (
            <TouchableOpacity onPress={onCancelSelection} style={styles.cancelSelectionBtn}>
              <Text style={styles.cancelSelectionText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Viewport Surface */}
      <View
        style={[styles.mapViewport, { width: containerWidth, height: containerHeight }]}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            position: 'absolute',
            left: originX,
            top: originY,
            width: renderedWidth,
            height: renderedHeight
          }}
        >
          {/* 1. Underlying Base KSR CAD Map */}
          <BaseStationMap />

          {/* 2. Interactive Overlay */}
          <Svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="neonRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
                <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* A. Blocked Path Overlay (Section 23) */}
            {Object.entries(blockageStatuses).map(([elemId, stat]) => {
              if (stat !== 'BLOCKED') return null;
              const fac = facilitiesData.find((f: any) => f.id === elemId);
              if (!fac) return null;
              return (
                <G key={`blockage_${elemId}`}>
                  <Circle
                    cx={fac.coordinates.x}
                    cy={fac.coordinates.y}
                    r={isDetailedZoom ? 48 : 36}
                    fill="rgba(239, 68, 68, 0.35)"
                    stroke="#EF4444"
                    strokeWidth="4"
                    strokeDasharray="8,6"
                  />
                  <SvgText
                    x={fac.coordinates.x}
                    y={fac.coordinates.y + 10}
                    fill="#EF4444"
                    fontSize="28"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    🚧
                  </SvgText>
                  <SvgText
                    x={fac.coordinates.x}
                    y={fac.coordinates.y + 40}
                    fill="#EF4444"
                    fontSize="20"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    BLOCKED
                  </SvgText>
                </G>
              );
            })}

            {/* B. Active Route Overlay (Section 18 & 22) */}
            {polylinePoints.length > 0 && (
              <G>
                {/* Glow Shadow */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="24"
                  strokeOpacity="0.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Core Neon Path */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="url(#neonRouteGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
            )}

            {/* C. Source Location Marker (Section 8) */}
            {currentLocation && (
              <G>
                <Circle
                  cx={currentLocation.x}
                  cy={currentLocation.y}
                  r="36"
                  fill="rgba(16, 185, 129, 0.35)"
                  stroke="#10B981"
                  strokeWidth="4"
                />
                <Circle cx={currentLocation.x} cy={currentLocation.y} r="18" fill="#10B981" />
                <SvgText
                  x={currentLocation.x}
                  y={currentLocation.y - 42}
                  fill="#10B981"
                  fontSize="26"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  📍 START
                </SvgText>
              </G>
            )}

            {/* D. Destination Location Marker */}
            {destinationLocation && (
              <G>
                <Circle
                  cx={destinationLocation.x}
                  cy={destinationLocation.y}
                  r="36"
                  fill="rgba(239, 68, 68, 0.35)"
                  stroke="#EF4444"
                  strokeWidth="4"
                />
                <Circle cx={destinationLocation.x} cy={destinationLocation.y} r="18" fill="#EF4444" />
                <SvgText
                  x={destinationLocation.x}
                  y={destinationLocation.y - 42}
                  fill="#EF4444"
                  fontSize="26"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🎯 DESTINATION
                </SvgText>
              </G>
            )}

            {/* E. Interactive Platform Badges (Section 14 & 20) */}
            {platformsData.map((p) => {
              return (
                <G key={p.id}>
                  {/* Left Badge */}
                  <Circle
                    cx={p.badgeLeft.x}
                    cy={p.badgeLeft.y}
                    r={isDetailedZoom ? 32 : 26}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    onPress={() => onSelectPlatform && onSelectPlatform(p)}
                  />
                  <SvgText
                    x={p.badgeLeft.x}
                    y={p.badgeLeft.y + 9}
                    fill="#000000"
                    fontSize="26"
                    fontWeight="900"
                    textAnchor="middle"
                    onPress={() => onSelectPlatform && onSelectPlatform(p)}
                  >
                    {p.number}
                  </SvgText>

                  {/* Right Badge */}
                  <Circle
                    cx={p.badgeRight.x}
                    cy={p.badgeRight.y}
                    r={isDetailedZoom ? 32 : 26}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    onPress={() => onSelectPlatform && onSelectPlatform(p)}
                  />
                  <SvgText
                    x={p.badgeRight.x}
                    y={p.badgeRight.y + 9}
                    fill="#000000"
                    fontSize="26"
                    fontWeight="900"
                    textAnchor="middle"
                    onPress={() => onSelectPlatform && onSelectPlatform(p)}
                  >
                    {p.number}
                  </SvgText>

                  {/* Platform Track Label */}
                  <SvgText
                    x="1200"
                    y={p.center.y + 10}
                    fill="#E2E8F0"
                    fontSize="28"
                    fontWeight="bold"
                    opacity={0.85}
                  >
                    PLATFORM {p.number}
                  </SvgText>
                </G>
              );
            })}

            {/* F. Source-Backed Facility Markers (Section 20 & 25) */}
            {showFacilities &&
              facilitiesData.map((f: any) => {
                const isBlocked = blockageStatuses[f.id] === 'BLOCKED';
                const isCaution = blockageStatuses[f.id] === 'LIMITED';
                const statusColor = isBlocked ? '#EF4444' : isCaution ? '#F97316' : '#10B981';

                const isLift = f.type === 'LIFT';
                const isRamp = f.type === 'RAMP';
                const isToilet = f.type === 'TOILET' || f.type === 'ACCESSIBLE_TOILET';

                // Reduce density at zoomed out levels (Section 25)
                if (!isDetailedZoom && !isLift && !isRamp && f.type !== 'METRO_LINK') {
                  return null;
                }

                let iconChar = '🏢';
                if (isLift) iconChar = '🛗';
                else if (isRamp) iconChar = '↗';
                else if (isToilet) iconChar = '🚻';
                else if (f.type === 'METRO_LINK') iconChar = '🚇';
                else if (f.type === 'TICKET_COUNTER') iconChar = '🎫';

                return (
                  <G key={f.id}>
                    <Circle
                      cx={f.coordinates.x}
                      cy={f.coordinates.y}
                      r={isDetailedZoom ? 26 : 22}
                      fill="#0F172A"
                      stroke={statusColor}
                      strokeWidth="3.5"
                      onPress={() => onSelectFacility && onSelectFacility(f)}
                    />
                    <SvgText
                      x={f.coordinates.x}
                      y={f.coordinates.y + 7}
                      fill="#FFFFFF"
                      fontSize="18"
                      fontWeight="bold"
                      textAnchor="middle"
                      onPress={() => onSelectFacility && onSelectFacility(f)}
                    >
                      {iconChar}
                    </SvgText>
                  </G>
                );
              })}

            {/* G. Tap Target Crosshair Indicator */}
            {cursorCoord && (
              <G>
                <Circle
                  cx={cursorCoord.x}
                  cy={cursorCoord.y}
                  r="24"
                  fill="rgba(56, 189, 248, 0.4)"
                  stroke="#38BDF8"
                  strokeWidth="3"
                />
                <Line
                  x1={cursorCoord.x - 36}
                  y1={cursorCoord.y}
                  x2={cursorCoord.x + 36}
                  y2={cursorCoord.y}
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                />
                <Line
                  x1={cursorCoord.x}
                  y1={cursorCoord.y - 36}
                  x2={cursorCoord.x}
                  y2={cursorCoord.y + 36}
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                />
              </G>
            )}
          </Svg>
        </View>

        {/* Floating Map Controls (Section 7) */}
        <View style={styles.floatingControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn} activeOpacity={0.8}>
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut} activeOpacity={0.8}>
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtnTextual} onPress={handleCenter} activeOpacity={0.8}>
            <Text style={styles.controlLabel}>⌾ CENTER</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtnTextual} onPress={handleReset} activeOpacity={0.8}>
            <Text style={styles.controlLabel}>↻ RESET</Text>
          </TouchableOpacity>

          {polylinePoints.length > 0 && (
            <TouchableOpacity style={styles.controlBtnActive} onPress={handleFitRoute} activeOpacity={0.8}>
              <Text style={styles.controlLabelActive}>⛶ FIT ROUTE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Map Legend (Section 21) */}
        <View style={styles.legendBar}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Open</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Blocked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00E5FF' }]} />
            <Text style={styles.legendText}>Route</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Platforms 1-10</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginHorizontal: 12,
    marginVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },
  fullscreenContainer: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  titleInfo: {
    flex: 1
  },
  titleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.8
  },
  cadBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 2
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fullscreenBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  fullscreenBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8'
  },
  selectionModeBanner: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectionModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  selectionModeIcon: {
    fontSize: 20
  },
  selectionModeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8
  },
  selectionModeSub: {
    fontSize: 10,
    color: '#E0F2FE',
    marginTop: 1
  },
  cancelSelectionBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  cancelSelectionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  mapViewport: {
    backgroundColor: '#070B13',
    position: 'relative',
    overflow: 'hidden'
  },
  floatingControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 6,
    alignItems: 'flex-end'
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  controlText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold'
  },
  controlBtnTextual: {
    paddingHorizontal: 8,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1.2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlLabel: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '700'
  },
  controlBtnActive: {
    paddingHorizontal: 8,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.95)',
    borderWidth: 1.2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlLabelActive: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  legendBar: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#CBD5E1'
  }
});
