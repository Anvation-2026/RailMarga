import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult, RouteStep } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

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

  return (
    <View style={styles.container}>
      {/* Blockage Alert Banner if active */}
      {blockageAlert && (
        <View style={styles.blockageAlertBox}>
          <Text style={styles.blockageAlertIcon}>🚧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockageAlertTitle}>Route Updated</Text>
            <Text style={styles.blockageAlertText}>{blockageAlert}</Text>
          </View>
        </View>
      )}

      {/* Header Metric Row */}
      <View style={styles.metricRow}>
        <View style={styles.destinationBadge}>
          <Text style={styles.destinationLabel}>DESTINATION</Text>
          <Text style={styles.destinationName} numberOfLines={1}>
            {route.destination.name}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{route.totalDistanceMeters}m</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{route.estimatedTimeMinutes} min</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.voiceBtn, voiceEnabled && styles.voiceBtnActive]}
          onPress={onToggleVoice}
          activeOpacity={0.8}
        >
          <Text style={styles.voiceBtnText}>{voiceEnabled ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Step Instruction Card */}
      {currentStep && (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                NEXT • STEP {currentStepIndex + 1} OF {route.steps.length}
              </Text>
            </View>
            <Text style={styles.stepTypeBadge}>
              {currentStep.distance > 0 ? `${currentStep.distance}m` : currentStep.pathType}
            </Text>
          </View>

          <Text style={styles.instructionText}>{currentStep.instruction}</Text>

          {currentStep.landmark ? (
            <View style={styles.landmarkRow}>
              <Text style={styles.landmarkIcon}>📍</Text>
              <Text style={styles.landmarkText} numberOfLines={1}>
                Landmark: {currentStep.landmark}
              </Text>
            </View>
          ) : null}

          {/* Accessibility pill indicators */}
          <View style={styles.accessibleRow}>
            <Text style={styles.accessiblePillText}>✓ Step-Free Corridor</Text>
            <Text style={styles.accessiblePillText}>• Accessible</Text>
          </View>
        </View>
      )}

      {/* Control Actions Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
          onPress={onPreviousStep}
          disabled={isFirst}
          activeOpacity={0.8}
        >
          <Text style={styles.navBtnText}>← Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStopNavigation}
          activeOpacity={0.8}
        >
          <Text style={styles.stopBtnText}>Exit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.nextBtn]}
          onPress={onAdvanceStep}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'Arrived ✓' : 'Next Step →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: Radii.hero,
    borderTopRightRadius: Radii.hero,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.floating
  },
  blockageAlertBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  blockageAlertIcon: {
    fontSize: 20
  },
  blockageAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error
  },
  blockageAlertText: {
    color: Colors.textPrimary,
    fontSize: 12,
    marginTop: 1
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  destinationBadge: {
    flex: 1,
    marginRight: Spacing.sm
  },
  destinationLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  destinationName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 9
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs
  },
  voiceBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm
  },
  voiceBtnActive: {
    backgroundColor: Colors.goldTintSolid,
    borderColor: Colors.goldPrimary
  },
  voiceBtnText: {
    fontSize: 16
  },
  stepCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  stepBadge: {
    backgroundColor: Colors.goldTintSolid,
    borderRadius: Radii.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.goldLight
  },
  stepBadgeText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6
  },
  stepTypeBadge: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  instructionText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6
  },
  landmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4
  },
  landmarkIcon: {
    fontSize: 12
  },
  landmarkText: {
    color: Colors.textSecondary,
    fontSize: 12
  },
  accessibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  accessiblePillText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xs
  },
  navBtn: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.button,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  navBtnDisabled: {
    opacity: 0.4
  },
  navBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  nextBtn: {
    backgroundColor: Colors.goldPrimary,
    borderColor: Colors.goldDark,
    ...Shadows.sm
  },
  nextBtnText: {
    color: Colors.charcoalPrimary,
    fontWeight: '700',
    fontSize: 13
  },
  stopBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  stopBtnText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600'
  }
});
