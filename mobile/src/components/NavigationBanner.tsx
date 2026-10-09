import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  AlertIcon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  RecenterIcon,
  FootprintsIcon,
  ZapIcon
} from './Icons';

interface NavigationBannerProps {
  route: RouteResult;
  currentStepIndex: number;
  voiceEnabled: boolean;
  blockageAlert: string | null;
  onAdvanceStep: () => void;
  onPreviousStep: () => void;
  onToggleVoice: () => void;
  onStopNavigation: () => void;
}

export const NavigationBanner: React.FC<NavigationBannerProps> = ({
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
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    restartSimulation,
    setSimulationSpeed,
    recenterOnUser
  } = useNavigationStore();

  // Desktop keyboard & physical step navigation listener (Spacebar / Right Arrow)
  React.useEffect(() => {
    if (!isPdrActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        takePdrStep();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isPdrActive, takePdrStep]);

  const steps = route?.steps || [];
  const currentStep: RouteStep | undefined = steps[currentStepIndex];
  const isLast = steps.length > 0 ? currentStepIndex >= steps.length - 1 : true;
  const isFirst = currentStepIndex === 0;

  const displayDistance = remainingDistanceMeters > 0 ? remainingDistanceMeters : route.totalDistanceMeters;
  const displayEta = remainingEtaMinutes > 0 ? remainingEtaMinutes : route.estimatedTimeMinutes;

  const renderManeuverIcon = (instruction: string, pathType: string) => {
    const text = (instruction + ' ' + pathType).toLowerCase();
    if (text.includes('lift') || text.includes('elevator')) {
      return <ElevatorIcon size={20} color="#1A1A1A" strokeWidth={2} />;
    }
    if (text.includes('ramp')) {
      return <RampIcon size={20} color="#1A1A1A" strokeWidth={2} />;
    }
    if (text.includes('arrive') || text.includes('platform')) {
      return <CheckIcon size={20} color="#16A34A" strokeWidth={2.5} />;
    }
    return <WalkIcon size={20} color="#1A1A1A" strokeWidth={2} />;
  };

  return (
    <View style={styles.container}>
      {/* 1. Live Reroute Incident Alert */}
      {blockageAlert && (
        <View style={styles.blockageAlertBox}>
          <AlertIcon size={14} color="#DC2626" strokeWidth={2} />
          <Text style={styles.blockageAlertText} numberOfLines={1}>{blockageAlert}</Text>
        </View>
      )}

      {/* 2. Destination Arrival Card */}
      {isArrived ? (
        <View style={styles.arrivedCard}>
          <View style={styles.arrivedIconBadge}>
            <CheckIcon size={22} color="#16A34A" strokeWidth={3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.arrivedBadgeText}>ARRIVED</Text>
            <Text style={styles.arrivedTitleText} numberOfLines={1}>
              {route.destination.name}
            </Text>
          </View>
          <TouchableOpacity style={styles.arrivedFinishBtn} onPress={onStopNavigation} activeOpacity={0.85}>
            <Text style={styles.arrivedFinishText}>Finish ✓</Text>
          </TouchableOpacity>
        </View>
      ) : currentStep ? (
        /* 3. Single Consolidated Unified Navigation Card (Max Width 640px, Clean & Compact) */
        <View style={styles.unifiedCard}>
          {/* Top Row: Maneuver icon + Instruction + Distance + Source */}
          <View style={styles.topRow}>
            <View style={styles.maneuverIconBox}>
              {renderManeuverIcon(currentStep.instruction, currentStep.pathType)}
            </View>

            <View style={styles.instructionCol}>
              <View style={styles.distanceBadgeRow}>
                <Text style={styles.distanceText}>
                  {currentStep.distance > 0 ? `In ${currentStep.distance} m` : 'At location'}
                </Text>
                {locationSource && (
                  <View
                    style={[
                      styles.sourcePill,
                      locationSource === 'DEMO SIMULATION' && styles.sourcePillDemo,
                      locationSource === 'REAL STEPS (PDR)' && styles.sourcePillEmerald,
                      locationSource === 'LIVE GPS' && styles.sourcePillGps
                    ]}
                  >
                    <Text style={styles.sourcePillText}>{locationSource}</Text>
                  </View>
                )}
                <Text style={styles.stepProgressText}>
                  Step {currentStepIndex + 1}/{steps.length}
                </Text>
              </View>
              <Text style={styles.instructionText} numberOfLines={1}>
                {currentStep.instruction}
              </Text>
            </View>
          </View>

          {/* Dynamic Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(((currentStepIndex + 1) / Math.max(steps.length, 1)) * 100)}%` }
              ]}
            />
          </View>

          {/* Bottom Row: Stats + Mode Controls + Quick Actions */}
          <View style={styles.bottomRow}>
            {/* Left: ETA and distance left */}
            <View style={styles.tripStats}>
              <Text style={styles.etaText}>{displayEta} min</Text>
              <Text style={styles.remainingText}>{displayDistance}m left</Text>
            </View>

            {/* Center: Mutually exclusive mode controls */}
            {locationSource === 'REAL STEPS (PDR)' || isPdrActive ? (
              <View style={styles.pdrInlineRow}>
                <TouchableOpacity
                  style={styles.pdrTakeStepBtn}
                  onPress={takePdrStep}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                >
                  <FootprintsIcon size={13} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.pdrTakeStepBtnText}>Take step (+0.75m)</Text>
                </TouchableOpacity>
                <Text style={styles.pdrStepCountText}>
                  {stepCount}/{totalSteps}
                </Text>
              </View>
            ) : (
              <View style={styles.simInlineRow}>
                {isSimulating ? (
                  <TouchableOpacity style={styles.simPlayBtn} onPress={pauseSimulation} activeOpacity={0.8}>
                    <PauseIcon size={12} color="#1A1A1A" strokeWidth={2} />
                    <Text style={styles.simPlayBtnText}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.simPlayBtn}
                    onPress={() => (locationSource === 'DEMO SIMULATION' ? resumeSimulation() : startSimulation(1))}
                    activeOpacity={0.8}
                  >
                    <PlayIcon size={12} color="#1A1A1A" strokeWidth={2} />
                    <Text style={styles.simPlayBtnText}>Resume</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.simRestartBtn} onPress={restartSimulation} activeOpacity={0.8}>
                  <RestartIcon size={12} color="#73736C" strokeWidth={2} />
                </TouchableOpacity>

                {/* Speed Pills: 0.5x Slow Tour, 1x Natural Walk, 2x, 4x */}
                <View style={styles.speedPillsContainer}>
                  {([0.5, 1, 2, 4] as const).map((spd) => (
                    <TouchableOpacity
                      key={spd}
                      style={[styles.speedPill, simulationSpeed === spd && styles.speedPillActive]}
                      onPress={() => setSimulationSpeed(spd)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.speedPillText, simulationSpeed === spd && styles.speedPillTextActive]}>
                        {spd}×
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Right: Camera Recenter, Voice, Prev/Next, Exit */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={recenterOnUser}
                activeOpacity={0.8}
                accessibilityLabel="Recenter camera"
              >
                <RecenterIcon size={14} color="#1A1A1A" strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, voiceEnabled && styles.actionBtnActive]}
                onPress={onToggleVoice}
                activeOpacity={0.8}
                accessibilityLabel={voiceEnabled ? "Mute voice" : "Enable voice"}
              >
                <VolumeIcon size={14} color={voiceEnabled ? '#1A1A1A' : '#73736C'} strokeWidth={1.8} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepBtn, isFirst && styles.stepBtnDisabled]}
                onPress={onPreviousStep}
                disabled={isFirst}
                activeOpacity={0.8}
              >
                <Text style={styles.stepBtnText}>◀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepBtn, styles.nextStepBtn]}
                onPress={onAdvanceStep}
                activeOpacity={0.8}
              >
                <Text style={styles.nextStepBtnText}>{isLast ? '✓' : '▶'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitBtn}
                onPress={onStopNavigation}
                activeOpacity={0.8}
                accessibilityLabel="Exit navigation"
              >
                <CloseIcon size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 6
  },
  blockageAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Shadows.card
  },
  blockageAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1
  },
  arrivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: Spacing.sm,
    ...Shadows.floating
  },
  arrivedIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrivedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5
  },
  arrivedTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  arrivedFinishBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill
  },
  arrivedFinishText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  unifiedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs + 2,
    paddingBottom: Spacing.xs,
    ...Shadows.floating
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  maneuverIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F5B800',
    alignItems: 'center',
    justifyContent: 'center'
  },
  instructionCol: {
    flex: 1
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309'
  },
  sourcePill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.xs
  },
  sourcePillDemo: {
    backgroundColor: '#F5B800'
  },
  sourcePillEmerald: {
    backgroundColor: '#047857'
  },
  sourcePillGps: {
    backgroundColor: '#166534'
  },
  sourcePillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  stepProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 'auto'
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 6
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5B800'
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6
  },
  tripStats: {
    minWidth: 70
  },
  etaText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  remainingText: {
    fontSize: 10,
    color: Colors.textSecondary
  },
  simInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  simPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F5B800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.xs
  },
  simPlayBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  simRestartBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  speedPillsContainer: {
    flexDirection: 'row',
    gap: 2
  },
  speedPill: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: Radii.xs,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  speedPillActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A'
  },
  speedPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#73736C'
  },
  speedPillTextActive: {
    color: '#FFFFFF'
  },
  pdrInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pdrTakeStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill
  },
  pdrTakeStepBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  pdrStepCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857'
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnActive: {
    backgroundColor: '#FFFDF5',
    borderColor: '#F5B800'
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnDisabled: {
    opacity: 0.35
  },
  stepBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A'
  },
  nextStepBtn: {
    backgroundColor: '#F5B800',
    borderColor: '#1A1A1A'
  },
  nextStepBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A'
  },
  exitBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
