import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RouteResult } from '../services/localRouter';
import { Colors, Radii, Spacing, Shadows } from '../theme/tokens';
import {
  WalkIcon,
  ElevatorIcon,
  RampIcon,
  CloseIcon,
  CheckIcon,
  AlertIcon,
  ArrowRightIcon
} from './Icons';

interface RoutePreviewCardProps {
  route: RouteResult;
  selectedProfileId: string;
  onStartNavigation: () => void;
  onFitRoute: () => void;
  onClosePreview?: () => void;
}

export const RoutePreviewCard: React.FC<RoutePreviewCardProps> = ({
  route,
  selectedProfileId,
  onStartNavigation,
  onFitRoute,
  onClosePreview
}) => {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const isStepFree = route.accessibility.stepFree;

  const renderStepIcon = (instruction: string) => {
    const text = instruction.toLowerCase();
    if (text.includes('lift') || text.includes('elevator')) {
      return <ElevatorIcon size={16} color="#1A1A1A" strokeWidth={1.75} />;
    }
    if (text.includes('ramp')) {
      return <RampIcon size={16} color="#1A1A1A" strokeWidth={1.75} />;
    }
    return <WalkIcon size={16} color="#1A1A1A" strokeWidth={1.75} />;
  };

  const stepsToDisplay = showAllSteps ? route.steps : route.steps.slice(0, 3);

  return (
    <View style={styles.card} nativeID="route-results-section">
      {/* Delivery Tracking Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.destinationTitle} numberOfLines={1}>
            {route.destination?.name || 'Destination'}
          </Text>
          <Text style={styles.originSub}>
            From {route.start?.name || 'Station entrance'}
          </Text>
        </View>

        {onClosePreview && (
          <TouchableOpacity
            onPress={onClosePreview}
            style={styles.closeBtn}
            activeOpacity={0.75}
            accessibilityLabel="Close route preview"
          >
            <CloseIcon size={16} color="#666660" />
          </TouchableOpacity>
        )}
      </View>

      {/* ETA & Distance Big Bold Tracking Stat (Delivery card style) */}
      <View style={styles.etaContainer}>
        <View style={styles.etaTextRow}>
          <Text style={styles.etaBigText}>
            {route.estimatedTimeMinutes} min
          </Text>
          <Text style={styles.etaBullet}>·</Text>
          <Text style={styles.distanceText}>
            {route.totalDistanceMeters} m
          </Text>
        </View>

        {/* Step-Free / Stairs Status Pill */}
        <View style={[styles.statusPill, isStepFree ? styles.statusPillGreen : styles.statusPillAmber]}>
          {isStepFree ? (
            <CheckIcon size={12} color="#16A34A" strokeWidth={2.5} />
          ) : (
            <AlertIcon size={12} color="#D97706" strokeWidth={2} />
          )}
          <Text style={[styles.statusPillText, isStepFree ? styles.statusPillTextGreen : styles.statusPillTextAmber]}>
            {isStepFree ? 'Step-free path' : 'Has stairs'}
          </Text>
        </View>
      </View>

      {/* Step-by-step directions */}
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsHeader}>Directions</Text>
        {stepsToDisplay.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepIconBox}>
              {renderStepIcon(step.instruction)}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
              <Text style={styles.stepMeta}>
                {step.distanceMeters} m · Floor: {step.floor === -1 ? 'Subway' : step.floor === 1 ? 'FOB' : 'Level 0'}
              </Text>
            </View>
          </View>
        ))}

        {route.steps.length > 3 && (
          <TouchableOpacity
            style={styles.moreStepsBtn}
            onPress={() => setShowAllSteps(!showAllSteps)}
            activeOpacity={0.7}
          >
            <Text style={styles.moreStepsText}>
              {showAllSteps ? 'Show fewer steps' : `+ ${route.steps.length - 3} more steps`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sticky Hero Golden Yellow Action CTA */}
      <TouchableOpacity
        style={styles.startNavBtn}
        onPress={onStartNavigation}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Start turn-by-turn navigation"
      >
        <Text style={styles.startNavText}>Start navigation</Text>
        <ArrowRightIcon size={18} color="#1A1A1A" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card, // 12px
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.sm
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs
  },
  destinationTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  originSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAF7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: Spacing.xs
  },
  etaTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  etaBigText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  etaBullet: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '700'
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1
  },
  statusPillGreen: {
    backgroundColor: Colors.successLight,
    borderColor: '#BBF7D0'
  },
  statusPillAmber: {
    backgroundColor: Colors.warningLight,
    borderColor: '#FDE68A'
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600'
  },
  statusPillTextGreen: {
    color: Colors.success
  },
  statusPillTextAmber: {
    color: Colors.warning
  },
  stepsContainer: {
    marginVertical: Spacing.xs,
    paddingTop: 4
  },
  stepsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F2'
  },
  stepIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  stepContent: {
    flex: 1
  },
  stepInstruction: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary
  },
  stepMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2
  },
  moreStepsBtn: {
    paddingVertical: 6,
    alignItems: 'center'
  },
  moreStepsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  startNavBtn: {
    height: 48,
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderRadius: Radii.pill, // 999px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm
  },
  startNavText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A'
  }
});
