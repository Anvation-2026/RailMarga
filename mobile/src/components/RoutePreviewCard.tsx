import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';

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
            <Text style={styles.routePillText}>⚡ FASTEST ROUTE</Text>
          </View>
          {isStepFree ? (
            <View style={styles.accessibleBadge}>
              <Text style={styles.accessibleBadgeText}>✓ Step-Free</Text>
            </View>
          ) : (
            <View style={styles.stairsBadge}>
              <Text style={styles.stairsBadgeText}>⚠ Stairs Included</Text>
            </View>
          )}
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity onPress={onFitRoute} style={styles.fitBtn} activeOpacity={0.8}>
            <Text style={styles.fitBtnText}>⛶ Fit Map</Text>
          </TouchableOpacity>
          {onClosePreview && (
            <TouchableOpacity onPress={onClosePreview} style={styles.closeBtn} activeOpacity={0.8}>
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
          Direct station path via verified indoor CAD network
        </Text>
      </View>

      {/* Metrics Row (Uber/Ola Style) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.estimatedTimeMinutes} min</Text>
          <Text style={styles.metricLabel}>Est. Walking Time</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.totalDistanceMeters}m</Text>
          <Text style={styles.metricLabel}>Total Distance</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.steps.length}</Text>
          <Text style={styles.metricLabel}>Route Steps</Text>
        </View>
      </View>

      {/* Vertical Transitions Summary */}
      <View style={styles.verticalTransitionsRow}>
        {route.accessibility.liftsUsed.length > 0 && (
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>🛗 Lift: {route.accessibility.liftsUsed.join(', ')}</Text>
          </View>
        )}
        {route.accessibility.rampsUsed.length > 0 && (
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>↗ Ramp: {route.accessibility.rampsUsed.join(', ')}</Text>
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
          Route Details & Accessibility {showExplanation ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {showExplanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationItem}>
            ✓ Tailored for {isWheelchair ? 'Mobility Disabled (Step-Free) profile' : 'selected passenger profile'}
          </Text>
          <Text style={styles.explanationItem}>
            {isStepFree ? '✓ 100% Step-free path with elevator & ramp access' : '✓ Direct walking corridor selected'}
          </Text>
          {route.accessibility.liftsUsed.length > 0 && (
            <Text style={styles.explanationItem}>
              ✓ Accessible elevator connection verified
            </Text>
          )}
        </View>
      )}

      {/* Start Navigation CTA (High-contrast Gold Uber/Swiggy Button) */}
      <TouchableOpacity
        style={styles.startNavBtn}
        onPress={() => onStartNavigation()}
        activeOpacity={0.85}
      >
        <Text style={styles.startNavText}>START NAVIGATION →</Text>
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
    borderWidth: 1,
    borderColor: '#EAEAEA',
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
    gap: 6
  },
  routePill: {
    backgroundColor: Colors.goldTintSolid,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.goldPrimary
  },
  routePillText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '800'
  },
  accessibleBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.success
  },
  accessibleBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700'
  },
  stairsBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.warning
  },
  stairsBadgeText: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '700'
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  fitBtn: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  fitBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  destHeader: {
    marginBottom: Spacing.sm
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  destSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: Radii.md,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#EFEFEF'
  },
  metricItem: {
    alignItems: 'center',
    flex: 1
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB'
  },
  verticalTransitionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.xs
  },
  facilityPill: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border
  },
  stairPill: {
    borderColor: Colors.errorLight,
    backgroundColor: '#FFF5F5'
  },
  facilityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  explanationHeader: {
    paddingVertical: 6,
    alignItems: 'center'
  },
  explanationHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.goldDark
  },
  explanationBox: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.sm,
    padding: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight
  },
  explanationItem: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2
  },
  startNavBtn: {
    backgroundColor: Colors.goldPrimary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Shadows.card
  },
  startNavText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
  }
});
