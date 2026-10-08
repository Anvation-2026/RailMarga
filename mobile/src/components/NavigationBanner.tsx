import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult, RouteStep } from '../services/localRouter';

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
  const currentStep: RouteStep | undefined = route.steps[currentStepIndex];
  const isLast = currentStepIndex >= route.steps.length - 1;
  const isFirst = currentStepIndex === 0;

  return (
    <View style={styles.container}>
      {/* Blockage Alert Banner if active */}
      {blockageAlert && (
        <View style={styles.blockageAlertBox}>
          <Text style={styles.blockageAlertText}>{blockageAlert}</Text>
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
                Step {currentStepIndex + 1} / {route.steps.length}
              </Text>
            </View>
            <Text style={styles.stepTypeBadge}>{currentStep.pathType}</Text>
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
          <Text style={[styles.navBtnText, styles.nextBtnText]}>
            {isLast ? 'Arrived ✓' : 'Next Step →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12
  },
  blockageAlertBox: {
    backgroundColor: '#991B1B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  blockageAlertText: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  destinationBadge: {
    flex: 1,
    marginRight: 12
  },
  destinationLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  destinationName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold'
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 9
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#475569',
    marginHorizontal: 10
  },
  voiceBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  voiceBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8'
  },
  voiceBtnText: {
    fontSize: 16
  },
  stepCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#0284C7'
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  stepBadge: {
    backgroundColor: '#0369A1',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8
  },
  stepBadgeText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: 'bold'
  },
  stepTypeBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600'
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8
  },
  landmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  landmarkIcon: {
    fontSize: 14
  },
  landmarkText: {
    color: '#94A3B8',
    fontSize: 12
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  navBtnDisabled: {
    opacity: 0.4
  },
  navBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold'
  },
  nextBtn: {
    backgroundColor: '#0284C7',
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  nextBtnText: {
    color: '#FFFFFF'
  },
  stopBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569'
  },
  stopBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold'
  }
});
