import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

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
  const [showExplanation, setShowExplanation] = useState(false);
  const isStepFree = route.accessibility.stepFree;
  const isWheelchair = selectedProfileId === 'mobility_disabled';

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.routePill}>
            <Text style={styles.routePillText}>RECOMMENDED ROUTE</Text>
          </View>
          {isStepFree ? (
            <View style={styles.accessibleBadge}>
              <Text style={styles.accessibleBadgeText}>✓ Step-Free</Text>
            </View>
          ) : (
            <View style={styles.stairsBadge}>
              <Text style={styles.stairsBadgeText}>⚠ Contains Stairs</Text>
            </View>
          )}
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity onPress={onFitRoute} style={styles.fitBtn} activeOpacity={0.8}>
            <Text style={styles.fitBtnText}>⛶ Fit Route</Text>
          </TouchableOpacity>
          {onClosePreview && (
            <TouchableOpacity onPress={onClosePreview} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Destination & Key Metric */}
      <View style={styles.destHeader}>
        <Text style={styles.destTitle} numberOfLines={1}>
          {route.destination.name}
        </Text>
        <Text style={styles.destSub}>
          {route.estimatedTimeMinutes} min • {route.totalDistanceMeters}m
        </Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.totalDistanceMeters}m</Text>
          <Text style={styles.metricLabel}>Distance</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.estimatedTimeMinutes} min</Text>
          <Text style={styles.metricLabel}>Est. Time</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.steps.length}</Text>
          <Text style={styles.metricLabel}>Steps</Text>
        </View>
      </View>

      {/* Vertical Transitions Summary */}
      <View style={styles.verticalTransitionsRow}>
        {route.accessibility.liftsUsed.length > 0 && (
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>🛗 Lift {route.accessibility.liftsUsed.join(', ')}</Text>
          </View>
        )}
        {route.accessibility.rampsUsed.length > 0 && (
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>↗ Ramp {route.accessibility.rampsUsed.join(', ')}</Text>
          </View>
        )}
        {route.accessibility.stairsUsed.length > 0 && (
          <View style={[styles.facilityPill, styles.stairPill]}>
            <Text style={[styles.facilityPillText, { color: Colors.error }]}>Stairs: {route.accessibility.stairsUsed.join(', ')}</Text>
          </View>
        )}
      </View>

      {/* Why This Route Explanation Accordion */}
      <TouchableOpacity
        style={styles.explanationHeader}
        onPress={() => setShowExplanation(!showExplanation)}
        activeOpacity={0.7}
      >
        <Text style={styles.explanationHeaderText}>
          Why this route? {showExplanation ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {showExplanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationItem}>
            ✓ Tailored for {isWheelchair ? 'Mobility Disabled profile' : 'selected passenger profile'}
          </Text>
          <Text style={styles.explanationItem}>
            {isStepFree ? '✓ 100% Step-free path selected' : '✓ Direct concourse corridor selected'}
          </Text>
          {route.accessibility.liftsUsed.length > 0 && (
            <Text style={styles.explanationItem}>
              ✓ Accessible elevator connection included
            </Text>
          )}
        </View>
      )}

      {/* Start Navigation CTA */}
      <TouchableOpacity
        style={styles.startNavBtn}
        onPress={onStartNavigation}
        activeOpacity={0.85}
      >
        <Text style={styles.startNavText}>START NAVIGATION</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.goldPrimary,
    ...Shadows.card
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  routePill: {
    backgroundColor: Colors.goldTintSolid,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.goldLight
  },
  routePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.goldDark,
    letterSpacing: 0.6
  },
  accessibleBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.success
  },
  accessibleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success
  },
  stairsBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.warning
  },
  stairsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  fitBtn: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  fitBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  closeBtn: {
    padding: 4
  },
  closeBtnText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '700'
  },
  destHeader: {
    marginBottom: Spacing.sm
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  destSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  metricItem: {
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border
  },
  verticalTransitionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs + 2
  },
  facilityPill: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  stairPill: {
    borderColor: Colors.errorLight,
    backgroundColor: Colors.errorLight
  },
  facilityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  explanationHeader: {
    paddingVertical: 4,
    marginBottom: 4
  },
  explanationHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.goldDark
  },
  explanationBox: {
    backgroundColor: Colors.goldTintSolid,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.sm,
    gap: 4
  },
  explanationItem: {
    fontSize: 12,
    color: Colors.charcoalPrimary,
    lineHeight: 16
  },
  startNavBtn: {
    backgroundColor: Colors.goldPrimary,
    borderRadius: Radii.button,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating
  },
  startNavText: {
    color: Colors.charcoalPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8
  }
});
