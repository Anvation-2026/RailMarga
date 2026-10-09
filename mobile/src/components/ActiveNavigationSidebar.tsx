import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RouteResult, RouteStep } from '../services/localRouter';
import { Colors, Radii, Spacing, Shadows } from '../theme/tokens';
import { useNavigationStore } from '../store/navigationStore';
import {
  ElevatorIcon,
  RampIcon,
  WalkIcon,
  CheckIcon,
  VolumeIcon,
  CloseIcon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  RecenterIcon,
  FootprintsIcon,
  ZapIcon,
  SatelliteIcon,
  AlertIcon
} from './Icons';

interface ActiveNavigationSidebarProps {
  route: RouteResult;
  currentStepIndex: number;
  voiceEnabled: boolean;
  blockageAlert: string | null;
  onAdvanceStep: () => void;
  onPreviousStep: () => void;
  onToggleVoice: () => void;
  onStopNavigation: () => void;
}

export const ActiveNavigationSidebar: React.FC<ActiveNavigationSidebarProps> = ({
  route,
  currentStepIndex,
  voiceEnabled,
  blockageAlert,
  onAdvanceStep,
  onPreviousStep,
  onToggleVoice,
  onStopNavigation
}) => {
  const {
    isSimulating,
    simulationSpeed,
    locationSource,
    remainingDistanceMeters,
    remainingEtaMinutes,
    isArrived,
    isPdrActive,
    stepCount,
    totalSteps,
    takePdrStep,
    startPdrMode,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    restartSimulation,
    setSimulationSpeed,
    recenterOnUser,
    startGpsTracking
  } = useNavigationStore();

  const steps = route?.steps || [];
  const currentStep: RouteStep | undefined = steps[currentStepIndex];
  const isLast = steps.length > 0 ? currentStepIndex >= steps.length - 1 : true;
  const isFirst = currentStepIndex === 0;

  const displayDistance = remainingDistanceMeters > 0 ? remainingDistanceMeters : route.totalDistanceMeters;
  const displayEta = remainingEtaMinutes > 0 ? remainingEtaMinutes : route.estimatedTimeMinutes;

  const renderManeuverIcon = (instruction: string, pathType: string, size = 20) => {
    const text = (instruction + ' ' + pathType).toLowerCase();
    if (text.includes('lift') || text.includes('elevator')) {
      return <ElevatorIcon size={size} color="#1A1A1A" strokeWidth={2} />;
    }
    if (text.includes('ramp')) {
      return <RampIcon size={size} color="#1A1A1A" strokeWidth={2} />;
    }
    if (text.includes('arrive') || text.includes('platform')) {
      return <CheckIcon size={size} color="#16A34A" strokeWidth={2.5} />;
    }
    return <WalkIcon size={size} color="#1A1A1A" strokeWidth={2} />;
  };

  return (
    <View style={styles.container}>
      {/* 1. Header with Destination & Live Status */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.liveBadgeRow}>
            <View
              style={[
                styles.livePulseDot,
                locationSource === 'DEMO SIMULATION'
                  ? styles.pulseGold
                  : locationSource === 'REAL STEPS (PDR)'
                  ? styles.pulseEmerald
                  : styles.pulseGreen
              ]}
            />
            <Text style={styles.liveBadgeText}>
              {locationSource ? `${locationSource} ACTIVE` : 'LIVE NAVIGATION'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exitNavBtn}
            onPress={onStopNavigation}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Exit navigation"
          >
            <CloseIcon size={14} color="#666660" />
            <Text style={styles.exitNavText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Prominent Source & Destination Journey Block */}
        <View style={styles.journeyRouteBlock}>
          <View style={styles.journeyPointRow}>
            <View style={styles.sourceDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pointLabel}>FROM (START / SOURCE)</Text>
              <Text style={styles.pointName} numberOfLines={1}>
                {route.start?.name || 'Terminal 1 Main Entrance (East)'}
              </Text>
            </View>
          </View>

          <View style={styles.journeyPointRow}>
            <View style={styles.destinationDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pointLabel}>TO (DESTINATION)</Text>
              <Text style={styles.destTitle} numberOfLines={1}>
                {route.destination?.name || 'Destination'}
              </Text>
            </View>
          </View>
        </View>

        {/* ETA & Distance Big Stat Row */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{displayEta} min</Text>
            <Text style={styles.statLabel}>remaining</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{displayDistance} m</Text>
            <Text style={styles.statLabel}>distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {currentStepIndex + 1}/{steps.length}
            </Text>
            <Text style={styles.statLabel}>step</Text>
          </View>
        </View>
      </View>

      {/* Incident / Obstruction Alert */}
      {blockageAlert && (
        <View style={styles.alertCard}>
          <AlertIcon size={16} color="#DC2626" strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Rerouting Active</Text>
            <Text style={styles.alertText}>{blockageAlert}</Text>
          </View>
        </View>
      )}

      {/* Destination Arrival Card */}
      {isArrived && (
        <View style={styles.arrivedCard}>
          <View style={styles.arrivedIconBadge}>
            <CheckIcon size={24} color="#16A34A" strokeWidth={3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.arrivedTitle}>ARRIVED</Text>
            <Text style={styles.arrivedSub}>
              You have reached {route.destination.name}
            </Text>
          </View>
          <TouchableOpacity style={styles.finishBtn} onPress={onStopNavigation} activeOpacity={0.85}>
            <Text style={styles.finishText}>Finish ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Hero Maneuver Instruction Card */}
      {!isArrived && currentStep && (
        <View style={styles.maneuverCard}>
          <View style={styles.maneuverTopRow}>
            <View style={styles.maneuverIconBox}>
              {renderManeuverIcon(currentStep.instruction, currentStep.pathType, 24)}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.maneuverDistance}>
                {currentStep.distance > 0 ? `In ${currentStep.distance} m` : 'At location'}
              </Text>
              <Text style={styles.maneuverInstruction}>
                {currentStep.instruction}
              </Text>
            </View>
          </View>

          {/* Dynamic Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(((currentStepIndex + 1) / Math.max(steps.length, 1)) * 100)}%` }
              ]}
            />
          </View>

          {currentStep.landmark ? (
            <View style={styles.landmarkTag}>
              <Text style={styles.landmarkTagText} numberOfLines={1}>
                Landmark: {currentStep.landmark}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* 3. Interactive Motion Controls */}
      <View style={styles.controlsCard}>
        {locationSource === 'REAL STEPS (PDR)' || isPdrActive ? (
          <View style={styles.pdrSection}>
            <View style={styles.pdrHeader}>
              <Text style={styles.pdrCountText}>
                Step {stepCount} of {totalSteps} taken
              </Text>
              <Text style={styles.pdrStrideText}>0.75m / stride</Text>
            </View>
            <TouchableOpacity
              style={styles.pdrActionBtn}
              onPress={takePdrStep}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Take physical step"
            >
              <FootprintsIcon size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.pdrActionText}>
                TAKE PHYSICAL STEP (+0.75m)
              </Text>
            </TouchableOpacity>
            <Text style={styles.keyboardHintText}>
              Tip: Press Spacebar or Right Arrow key to advance
            </Text>
          </View>
        ) : (
          <View style={styles.simSection}>
            <View style={styles.simTopRow}>
              {isSimulating ? (
                <TouchableOpacity style={styles.playPauseBtn} onPress={pauseSimulation} activeOpacity={0.8}>
                  <PauseIcon size={14} color="#1A1A1A" strokeWidth={2} />
                  <Text style={styles.playPauseText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.playPauseBtn}
                  onPress={() => (locationSource === 'DEMO SIMULATION' ? resumeSimulation() : startSimulation(1))}
                  activeOpacity={0.8}
                >
                  <PlayIcon size={14} color="#1A1A1A" strokeWidth={2} />
                  <Text style={styles.playPauseText}>
                    {locationSource === 'DEMO SIMULATION' ? 'Resume' : 'Simulate walk'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.restartBtn} onPress={restartSimulation} activeOpacity={0.8}>
                <RestartIcon size={14} color="#73736C" strokeWidth={2} />
              </TouchableOpacity>

              {/* Speed Pills: 0.5x Slow Tour, 1x Natural, 2x, 4x */}
              <View style={styles.speedRow}>
                {([0.5, 1, 2, 4] as const).map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    style={[styles.speedPill, simulationSpeed === spd && styles.speedPillActive]}
                    onPress={() => setSimulationSpeed(spd)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.speedText, simulationSpeed === spd && styles.speedTextActive]}>
                      {spd}×
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Source Switcher Toolbar */}
        <View style={styles.sourceSwitcherRow}>
          <Text style={styles.sourceSwitcherLabel}>Mode:</Text>
          <TouchableOpacity
            style={[styles.modePill, locationSource === 'LIVE GPS' && styles.modePillActive]}
            onPress={async () => {
              const ok = await startGpsTracking();
              if (!ok) alert('No GPS signal indoors. Using concourse anchor.');
            }}
            activeOpacity={0.75}
          >
            <SatelliteIcon size={12} color={locationSource === 'LIVE GPS' ? '#FFFFFF' : '#1A1A1A'} strokeWidth={1.8} />
            <Text style={[styles.modePillText, locationSource === 'LIVE GPS' && styles.modePillTextActive]}>
              GPS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, (locationSource === 'REAL STEPS (PDR)' || isPdrActive) && styles.modePillActiveEmerald]}
            onPress={startPdrMode}
            activeOpacity={0.75}
          >
            <FootprintsIcon size={12} color={(locationSource === 'REAL STEPS (PDR)' || isPdrActive) ? '#FFFFFF' : '#047857'} strokeWidth={1.8} />
            <Text style={[styles.modePillText, (locationSource === 'REAL STEPS (PDR)' || isPdrActive) && styles.modePillTextActive]}>
              Steps
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, locationSource === 'DEMO SIMULATION' && !isPdrActive && styles.modePillActiveGold]}
            onPress={() => startSimulation(1)}
            activeOpacity={0.75}
          >
            <ZapIcon size={12} color="#1A1A1A" strokeWidth={2.2} />
            <Text style={styles.modePillText}>Demo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Full Turn-by-Turn Directions List (Interactive) */}
      <View style={styles.stepsListCard}>
        <View style={styles.stepsListHeader}>
          <Text style={styles.stepsListTitle}>Journey Steps</Text>
          <Text style={styles.stepsListSub}>Click step to inspect</Text>
        </View>

        <ScrollView style={styles.stepsScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.stepItemRow,
                  isCurrent && styles.stepItemCurrent,
                  isCompleted && styles.stepItemCompleted
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    isCurrent && styles.stepBadgeCurrent,
                    isCompleted && styles.stepBadgeCompleted
                  ]}
                >
                  {isCompleted ? (
                    <CheckIcon size={12} color="#16A34A" strokeWidth={2.5} />
                  ) : (
                    <Text style={[styles.stepBadgeText, isCurrent && styles.stepBadgeTextCurrent]}>
                      {idx + 1}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.stepItemInstruction,
                      isCurrent && styles.stepItemInstructionCurrent,
                      isCompleted && styles.stepItemInstructionCompleted
                    ]}
                  >
                    {st.instruction}
                  </Text>
                  <Text style={styles.stepItemMeta}>
                    {st.distance} m · {(st as any).floor === -1 ? 'Subway' : (st as any).floor === 1 ? 'FOB Bridge' : 'Platform Level'}
                  </Text>
                </View>

                {isCurrent && (
                  <View style={styles.currentIndicatorPill}>
                    <Text style={styles.currentIndicatorText}>HERE</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Bottom Navigation Toolbar */}
      <View style={styles.footerNavRow}>
        <TouchableOpacity
          style={styles.navToolBtn}
          onPress={recenterOnUser}
          activeOpacity={0.8}
          accessibilityLabel="Recenter camera on location"
        >
          <RecenterIcon size={16} color="#1A1A1A" strokeWidth={2} />
          <Text style={styles.navToolText}>Recenter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navToolBtn, voiceEnabled && styles.navToolBtnActive]}
          onPress={onToggleVoice}
          activeOpacity={0.8}
          accessibilityLabel={voiceEnabled ? "Mute voice guidance" : "Unmute voice"}
        >
          <VolumeIcon size={16} color={voiceEnabled ? '#1A1A1A' : '#73736C'} strokeWidth={1.8} />
          <Text style={styles.navToolText}>{voiceEnabled ? 'Voice ON' : 'Muted'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepNavBtn, isFirst && styles.stepNavBtnDisabled]}
          onPress={onPreviousStep}
          disabled={isFirst}
          activeOpacity={0.8}
        >
          <Text style={styles.stepNavBtnText}>◀ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepNavBtn, styles.stepNavBtnNext]}
          onPress={onAdvanceStep}
          activeOpacity={0.8}
        >
          <Text style={styles.stepNavBtnNextText}>{isLast ? 'Arrived ✓' : 'Next ▶'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.sm
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.card
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  pulseGold: {
    backgroundColor: '#F5B800'
  },
  pulseEmerald: {
    backgroundColor: '#10B981'
  },
  pulseGreen: {
    backgroundColor: '#16A34A'
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 0.6
  },
  exitNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  exitNavText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  journeyRouteBlock: {
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs + 2,
    gap: 8,
    marginTop: 4
  },
  journeyPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#D1FAE5'
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5B800',
    borderWidth: 1.5,
    borderColor: '#FEF3C7'
  },
  pointLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#73736C',
    letterSpacing: 0.5
  },
  pointName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  destTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.sm
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626'
  },
  alertText: {
    fontSize: 11,
    color: '#991B1B'
  },
  arrivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#ECFDF5',
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: Spacing.md
  },
  arrivedIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrivedTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#065F46'
  },
  arrivedSub: {
    fontSize: 12,
    color: '#047857'
  },
  finishBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill
  },
  finishText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  maneuverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.card
  },
  maneuverTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm
  },
  maneuverIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#F5B800',
    alignItems: 'center',
    justifyContent: 'center'
  },
  maneuverDistance: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309'
  },
  maneuverInstruction: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.sm
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5B800'
  },
  landmarkTag: {
    marginTop: Spacing.xs,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start'
  },
  landmarkTagText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600'
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    ...Shadows.card
  },
  simSection: {
    gap: 8
  },
  simTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6
  },
  playPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F5B800'
  },
  playPauseText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  restartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  speedRow: {
    flexDirection: 'row',
    gap: 4
  },
  speedPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.xs,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  speedPillActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A'
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#73736C'
  },
  speedTextActive: {
    color: '#FFFFFF'
  },
  pdrSection: {
    gap: 6
  },
  pdrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pdrCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46'
  },
  pdrStrideText: {
    fontSize: 10,
    color: '#047857'
  },
  pdrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 9,
    borderRadius: Radii.pill,
    ...Shadows.card
  },
  pdrActionText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4
  },
  keyboardHintText: {
    fontSize: 9.5,
    color: '#047857',
    textAlign: 'center',
    fontWeight: '500'
  },
  sourceSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  sourceSwitcherLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  modePillActive: {
    backgroundColor: '#166534',
    borderColor: '#166534'
  },
  modePillActiveEmerald: {
    backgroundColor: '#047857',
    borderColor: '#047857'
  },
  modePillActiveGold: {
    backgroundColor: '#F5B800',
    borderColor: '#1A1A1A'
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A'
  },
  modePillTextActive: {
    color: '#FFFFFF'
  },
  stepsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    ...Shadows.card
  },
  stepsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 4
  },
  stepsListTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  stepsListSub: {
    fontSize: 10,
    color: Colors.textSecondary
  },
  stepsScroll: {
    maxHeight: 210
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  stepItemCurrent: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F5B800'
  },
  stepItemCompleted: {
    opacity: 0.65
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBadgeCurrent: {
    backgroundColor: '#F5B800',
    borderColor: '#1A1A1A'
  },
  stepBadgeCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981'
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  stepBadgeTextCurrent: {
    color: '#1A1A1A'
  },
  stepItemInstruction: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  stepItemInstructionCurrent: {
    fontWeight: '800',
    color: '#1A1A1A'
  },
  stepItemInstructionCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary
  },
  stepItemMeta: {
    fontSize: 9.5,
    color: Colors.textSecondary,
    marginTop: 1
  },
  currentIndicatorPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    backgroundColor: '#F5B800'
  },
  currentIndicatorText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#1A1A1A'
  },
  footerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  navToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card
  },
  navToolBtnActive: {
    backgroundColor: '#FFFDF5',
    borderColor: '#F5B800'
  },
  navToolText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1A1A1A'
  },
  stepNavBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card
  },
  stepNavBtnDisabled: {
    opacity: 0.4
  },
  stepNavBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  stepNavBtnNext: {
    backgroundColor: '#F5B800',
    borderColor: '#1A1A1A'
  },
  stepNavBtnNextText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A'
  }
});
