import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult, RouteStep } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

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

  const getStepIcon = (instruction: string, pathType: string) => {
    const text = (instruction + ' ' + pathType).toLowerCase();
    if (text.includes('lift') || text.includes('elevator')) return '🛗';
    if (text.includes('ramp')) return '↗️';
    if (text.includes('stair') || text.includes('steps')) return '🪜';
    if (text.includes('left')) return '↖️';
    if (text.includes('right')) return '↗️';
    if (text.includes('arrive') || text.includes('platform')) return '🏁';
    return '⬆️';
  };

  return (
    <View style={styles.container}>
      {/* Blockage Alert Banner if active */}
      {blockageAlert && (
        <View style={styles.blockageAlertBox}>
          <Text style={styles.blockageAlertIcon}>🚧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockageAlertTitle}>Live Route Re-routing</Text>
            <Text style={styles.blockageAlertText}>{blockageAlert}</Text>
          </View>
        </View>
      )}

      {/* Main Turn-by-Turn Maneuver Card (Google Maps / Uber HUD) */}
      {currentStep && (
        <View style={styles.hudCard}>
          <View style={styles.hudTopRow}>
            <View style={styles.maneuverIconBox}>
              <Text style={styles.maneuverIcon}>{getStepIcon(currentStep.instruction, currentStep.pathType)}</Text>
            </View>
            <View style={styles.hudInstructionCol}>
              <View style={styles.distanceBadgeRow}>
                <Text style={styles.distanceText}>
                  {currentStep.distance > 0 ? `In ${currentStep.distance}m` : 'At location'}
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
              <Text style={styles.landmarkIcon}>📍</Text>
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
          >
            <Text style={styles.actionBtnIcon}>{voiceEnabled ? '🔊' : '🔇'}</Text>
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
            <Text style={styles.nextStepBtnText}>
              {isLast ? 'Arrived ✓' : 'Next ▶'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={onStopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.exitBtnText}>✕</Text>
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
    backgroundColor: '#FEF3C7',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  blockageAlertIcon: {
    fontSize: 18,
    marginRight: 8
  },
  blockageAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E'
  },
  blockageAlertText: {
    fontSize: 11,
    color: '#78350F'
  },
  hudCard: {
    backgroundColor: '#1E293B',
    borderRadius: Radii.lg,
    padding: 14,
    ...Shadows.floating
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  maneuverIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  maneuverIcon: {
    fontSize: 24
  },
  hudInstructionCol: {
    flex: 1
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.3
  },
  stepProgressPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  stepProgressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8'
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981'
  },
  landmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  landmarkIcon: {
    fontSize: 11,
    marginRight: 4
  },
  landmarkText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card
  },
  tripStats: {
    justifyContent: 'center'
  },
  etaText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  remainingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500'
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
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  actionBtnActive: {
    backgroundColor: Colors.goldTintSolid,
    borderColor: Colors.goldPrimary
  },
  actionBtnIcon: {
    fontSize: 16
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border
  },
  stepBtnDisabled: {
    opacity: 0.4
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  nextStepBtn: {
    backgroundColor: Colors.goldPrimary,
    borderColor: Colors.goldPrimary
  },
  nextStepBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  exitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626'
  }
});
