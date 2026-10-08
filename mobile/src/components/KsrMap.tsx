import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  PanResponder
} from 'react-native';
import Svg, {
  SvgXml,
  Circle,
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
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

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
  const [dashOffset, setDashOffset] = useState<number>(0);

  // Continuous animation loop for moving dashed line (marching ants effect)
  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) return;
    const interval = setInterval(() => {
      setDashOffset((prev) => (prev <= -76 ? 0 : prev - 2));
    }, 45);
    return () => clearInterval(interval);
  }, [routeCoordinates]);

  const blockageStatuses = useBlockageStore((state) => state.statuses);

  // Compute container dimensions
  const containerWidth = isFullscreen ? SCREEN_WIDTH : SCREEN_WIDTH - 24;
  const containerHeight = isFullscreen
    ? Dimensions.get('window').height - 120
    : Math.max(300, containerWidth * ASPECT_RATIO + 40);

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
      onPanResponderGrant: (evt) => {
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

  // Marker visibility based on zoom level to prevent clutter
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

      {/* Mode Guidance Alert */}
      {selectionMode !== 'none' && (
        <View style={styles.selectionModeBanner}>
          <View style={styles.selectionModeLeft}>
            <View style={styles.modeIconWrapper}>
              <Text style={styles.selectionModeIcon}>
                {selectionMode === 'source' ? '📍' : '🎯'}
              </Text>
            </View>
            <View>
              <Text style={styles.selectionModeTitle}>
                {selectionMode === 'source' ? 'SELECT STARTING POINT' : 'SELECT DESTINATION'}
              </Text>
              <Text style={styles.selectionModeSub}>
                {selectionMode === 'source'
                  ? 'Tap anywhere on the KSR map to anchor start.'
                  : 'Tap a destination platform or facility on the map.'}
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

          {/* 2. Interactive Premium Overlay */}
          <Svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id="goldRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={Colors.goldPrimary} stopOpacity="1" />
                <Stop offset="100%" stopColor={Colors.goldDark} stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* A. Blocked Path Overlay */}
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
                    fill={Colors.errorTint}
                    stroke={Colors.error}
                    strokeWidth="4"
                    strokeDasharray="8,6"
                  />
                  <SvgText
                    x={fac.coordinates.x}
                    y={fac.coordinates.y + 10}
                    fill={Colors.error}
                    fontSize="28"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    🚧
                  </SvgText>
                  <SvgText
                    x={fac.coordinates.x}
                    y={fac.coordinates.y + 40}
                    fill={Colors.error}
                    fontSize="20"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    BLOCKED
                  </SvgText>
                </G>
              );
            })}

            {/* B. Active Route Overlay (Continuously Moving Green Dashed Line) */}
            {polylinePoints.length > 0 && (
              <G>
                {/* 1. Luminous Green Ambient Glow */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.28)"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 2. Soft Green Guide Line */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 3. Main Emerald Green Dashed Moving Line */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="24,14"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 4. Bright Mint Moving Core Dash for Motion Depth */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#A7F3D0"
                  strokeWidth="4"
                  strokeDasharray="14,24"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
            )}

            {/* C. Source Location Marker (Charcoal + Gold Accent) */}
            {currentLocation && (
              <G>
                <Circle
                  cx={currentLocation.x}
                  cy={currentLocation.y}
                  r="36"
                  fill={Colors.goldTintMedium}
                  stroke={Colors.charcoalPrimary}
                  strokeWidth="4"
                />
                <Circle cx={currentLocation.x} cy={currentLocation.y} r="18" fill={Colors.charcoalPrimary} />
                <Circle cx={currentLocation.x} cy={currentLocation.y} r="8" fill={Colors.goldPrimary} />
                <SvgText
                  x={currentLocation.x}
                  y={currentLocation.y - 44}
                  fill={Colors.charcoalPrimary}
                  fontSize="26"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  📍 START
                </SvgText>
              </G>
            )}

            {/* D. Destination Location Marker (Gold / Dark Gold) */}
            {destinationLocation && (
              <G>
                <Circle
                  cx={destinationLocation.x}
                  cy={destinationLocation.y}
                  r="36"
                  fill={Colors.goldTintMedium}
                  stroke={Colors.goldPrimary}
                  strokeWidth="4"
                />
                <Circle cx={destinationLocation.x} cy={destinationLocation.y} r="18" fill={Colors.goldPrimary} />
                <Circle cx={destinationLocation.x} cy={destinationLocation.y} r="8" fill={Colors.charcoalPrimary} />
                <SvgText
                  x={destinationLocation.x}
                  y={destinationLocation.y - 44}
                  fill={Colors.goldDark}
                  fontSize="26"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🎯 DESTINATION
                </SvgText>
              </G>
            )}

            {/* E. Interactive Platform Badges */}
            {platformsData.map((p) => {
              return (
                <G key={p.id}>
                  {/* Left Badge */}
                  <Circle
                    cx={p.badgeLeft.x}
                    cy={p.badgeLeft.y}
                    r={isDetailedZoom ? 32 : 26}
                    fill={Colors.goldPrimary}
                    stroke={Colors.bgPrimary}
                    strokeWidth="3.5"
                    onPress={() => onSelectPlatform && onSelectPlatform(p)}
                  />
                  <SvgText
                    x={p.badgeLeft.x}
                    y={p.badgeLeft.y + 9}
                    fill={Colors.textWhite}
                    fontSize="24"
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
                    fill={Colors.goldPrimary}
                    stroke={Colors.bgPrimary}
                    strokeWidth="3.5"
                    onPress={() => onSelectPlatform && onSelectPlatform(p)}
                  />
                  <SvgText
                    x={p.badgeRight.x}
                    y={p.badgeRight.y + 9}
                    fill={Colors.textWhite}
                    fontSize="24"
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
                    fill={Colors.textSecondary}
                    fontSize="26"
                    fontWeight="bold"
                    opacity={0.8}
                  >
                    PLATFORM {p.number}
                  </SvgText>
                </G>
              );
            })}

            {/* F. Source-Backed Facility Markers */}
            {showFacilities &&
              facilitiesData.map((f: any) => {
                const isBlocked = blockageStatuses[f.id] === 'BLOCKED';
                const isCaution = blockageStatuses[f.id] === 'LIMITED';
                const statusColor = isBlocked ? Colors.error : isCaution ? Colors.warning : Colors.success;

                const isLift = f.type === 'LIFT';
                const isRamp = f.type === 'RAMP';
                const isToilet = f.type === 'TOILET' || f.type === 'ACCESSIBLE_TOILET';

                // Reduce density at zoomed out levels
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
                      fill={Colors.bgPrimary}
                      stroke={statusColor}
                      strokeWidth="3"
                      onPress={() => onSelectFacility && onSelectFacility(f)}
                    />
                    <SvgText
                      x={f.coordinates.x}
                      y={f.coordinates.y + 7}
                      fill={Colors.textPrimary}
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

            {/* G. Tap Target Crosshair Indicator (Gold) */}
            {cursorCoord && (
              <G>
                <Circle
                  cx={cursorCoord.x}
                  cy={cursorCoord.y}
                  r="24"
                  fill={Colors.goldTintMedium}
                  stroke={Colors.goldPrimary}
                  strokeWidth="3"
                />
                <Line
                  x1={cursorCoord.x - 36}
                  y1={cursorCoord.y}
                  x2={cursorCoord.x + 36}
                  y2={cursorCoord.y}
                  stroke={Colors.goldPrimary}
                  strokeWidth="2.5"
                />
                <Line
                  x1={cursorCoord.x}
                  y1={cursorCoord.y - 36}
                  x2={cursorCoord.x}
                  y2={cursorCoord.y + 36}
                  stroke={Colors.goldPrimary}
                  strokeWidth="2.5"
                />
              </G>
            )}
          </Svg>
        </View>

        {/* Floating Map Controls (White Surfaces + Subtle Shadow) */}
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

        {/* Compact Map Legend */}
        <View style={styles.legendBar}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Open</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.legendText}>Blocked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Route (Active)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.charcoalPrimary }]} />
            <Text style={styles.legendText}>PF 1-10</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.hero,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
    ...Shadows.card
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
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  titleInfo: {
    flex: 1
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.6
  },
  cadBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  fullscreenBtn: {
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  fullscreenBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  selectionModeBanner: {
    backgroundColor: Colors.goldTintSolid,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.goldLight
  },
  selectionModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1
  },
  modeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.goldPrimary
  },
  selectionModeIcon: {
    fontSize: 14
  },
  selectionModeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.goldDark,
    letterSpacing: 0.6
  },
  selectionModeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1
  },
  cancelSelectionBtn: {
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  cancelSelectionText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600'
  },
  mapViewport: {
    backgroundColor: Colors.mapBg,
    position: 'relative',
    overflow: 'hidden'
  },
  floatingControls: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    gap: Spacing.xs - 2,
    alignItems: 'flex-end'
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating
  },
  controlText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600'
  },
  controlBtnTextual: {
    paddingHorizontal: Spacing.sm,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm
  },
  controlLabel: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '600'
  },
  controlBtnActive: {
    paddingHorizontal: Spacing.sm,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.goldPrimary,
    borderWidth: 1,
    borderColor: Colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating
  },
  controlLabelActive: {
    color: Colors.charcoalPrimary,
    fontSize: 10,
    fontWeight: '700'
  },
  legendBar: {
    position: 'absolute',
    left: Spacing.sm,
    bottom: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary
  }
});
