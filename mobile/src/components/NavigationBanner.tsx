import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult, RouteStep } from '../services/localRouter';
import { Colors, Radii, Spacing, Shadows } from '../theme/tokens';
import {
  ElevatorIcon,
  RampIcon,
  WalkIcon,
  CheckIcon,
  VolumeIcon,
  CloseIcon,
  AlertIcon,
  ArrowRightIcon
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
  const steps = route?.steps || [];
  const currentStep: RouteStep | undefined = steps[currentStepIndex];
  const isLast = steps.length > 0 ? currentStepIndex >= steps.length - 1 : true;
  const isFirst = currentStepIndex === 0;

  const renderManeuverIcon = (instruction: string, pathType: string) => {
    const text = (instruction + ' ' + pathType).toLowerCase();
    if (text.includes('lift') || text.includes('elevator')) {
      return <ElevatorIcon size={22} color="#1A1A1A" strokeWidth={2} />;
    }
    if (text.includes('ramp')) {
      return <RampIcon size={22} color="#1A1A1A" strokeWidth={2} />;
    }
    if (text.includes('arrive') || text.includes('platform')) {
      return <CheckIcon size={22} color="#16A34A" strokeWidth={2.5} />;
    }
    return <WalkIcon size={22} color="#1A1A1A" strokeWidth={2} />;
  };

  return (
    <View style={styles.container}>
      {/* Live Reroute Incident Banner */}
      {blockageAlert && (
        <View style={styles.blockageAlertBox}>
          <AlertIcon size={16} color="#DC2626" strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.blockageAlertTitle}>Live rerouting active</Text>
            <Text style={styles.blockageAlertText}>{blockageAlert}</Text>
          </View>
        </View>
      )}

      {/* Main Turn-by-Turn Guidance Card */}
      {currentStep && (
        <View style={styles.hudCard}>
          <View style={styles.hudTopRow}>
            <View style={styles.maneuverIconBox}>
              {renderManeuverIcon(currentStep.instruction, currentStep.pathType)}
            </View>
            <View style={styles.hudInstructionCol}>
              <View style={styles.distanceBadgeRow}>
                <Text style={styles.distanceText}>
                  {currentStep.distance > 0 ? `In ${currentStep.distance} m` : 'At location'}
                </Text>
                <View style={styles.stepProgressPill}>
                  <Text style={styles.stepProgressText}>
                    Step {currentStepIndex + 1} of {steps.length}
                  </Text>
                </View>
              </View>
              <Text style={styles.instructionText} numberOfLines={2}>
                {currentStep.instruction}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(((currentStepIndex + 1) / Math.max(steps.length, 1)) * 100)}%` }
              ]}
            />
          </View>

          {currentStep.landmark ? (
            <View style={styles.landmarkRow}>
              <Text style={styles.landmarkText} numberOfLines={1}>
                Landmark: {currentStep.landmark}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Bottom Floating Stats & Control Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.tripStats}>
          <Text style={styles.etaText}>{route.estimatedTimeMinutes} min</Text>
          <Text style={styles.remainingText}>{route.totalDistanceMeters}m remaining</Text>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={[styles.actionBtn, voiceEnabled && styles.actionBtnActive]}
            onPress={onToggleVoice}
            activeOpacity={0.8}
            accessibilityLabel={voiceEnabled ? "Mute voice guidance" : "Enable voice guidance"}
          >
            <VolumeIcon size={16} color={voiceEnabled ? '#1A1A1A' : '#73736C'} strokeWidth={1.75} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepBtn, isFirst && styles.stepBtnDisabled]}
            onPress={onPreviousStep}
            disabled={isFirst}
            activeOpacity={0.8}
            accessibilityLabel="Previous navigation step"
          >
            <Text style={[styles.stepBtnText, isFirst && styles.stepBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepBtn, styles.nextStepBtn]}
            onPress={onAdvanceStep}
            activeOpacity={0.8}
            accessibilityLabel={isLast ? "Arrived at destination" : "Next step"}
          >
            <Text style={styles.nextStepBtnText}>
              {isLast ? 'Arrived' : 'Next'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={onStopNavigation}
            activeOpacity={0.8}
            accessibilityLabel="Exit navigation guidance"
          >
            <CloseIcon size={14} color="#DC2626" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs
  },
  blockageAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.card,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  blockageAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  blockageAlertText: {
    fontSize: 11,
    color: '#991B1B'
  },
  hudCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Shadows.floating
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  maneuverIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  hudInstructionCol: {
    flex: 1
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  stepProgressPill: {
    backgroundColor: '#FAFAF7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border
  },
  stepProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#E8E8E3',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary // Hero Golden Yellow
  },
  landmarkRow: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F2'
  },
  landmarkText: {
    fontSize: 11,
    color: Colors.textSecondary
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
    ...Shadows.floating
  },
  tripStats: {
    flex: 1
  },
  etaText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  remainingText: {
    fontSize: 11,
    color: Colors.textSecondary
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  stepBtn: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnDisabled: {
    opacity: 0.4
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  stepBtnTextDisabled: {
    color: Colors.textSecondary
  },
  nextStepBtn: {
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderColor: Colors.primary
  },
  nextStepBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
