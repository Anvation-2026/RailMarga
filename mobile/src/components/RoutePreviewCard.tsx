import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteResult } from '../services/localRouter';

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
  const isWheelchair = selectedProfileId === 'mobility_disabled';
  const isStepFree = route.accessibility.stepFree;

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
              <Text style={styles.accessibleBadgeText}>✓ 100% Step-Free</Text>
            </View>
          ) : (
            <View style={styles.stairsBadge}>
              <Text style={styles.stairsBadgeText}>⚠️ Contains Stairs</Text>
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

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.totalDistanceMeters}m</Text>
          <Text style={styles.metricLabel}>Total Distance</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.estimatedTimeMinutes} min</Text>
          <Text style={styles.metricLabel}>Estimated Time</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{route.steps.length}</Text>
          <Text style={styles.metricLabel}>Navigation Steps</Text>
        </View>
      </View>

      {/* Vertical Transitions Summary */}
      <View style={styles.verticalTransitionsRow}>
        {route.accessibility.liftsUsed.length > 0 && (
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>🛗 Lifts: {route.accessibility.liftsUsed.join(', ')}</Text>
          </View>
        )}
        {route.accessibility.rampsUsed.length > 0 && (
          <View style={styles.facilityPill}>
            <Text style={styles.facilityPillText}>↗️ Ramps: {route.accessibility.rampsUsed.join(', ')}</Text>
          </View>
        )}
        {route.accessibility.stairsUsed.length > 0 && (
          <View style={[styles.facilityPill, styles.stairPill]}>
            <Text style={[styles.facilityPillText, { color: '#FCA5A5' }]}>Stairs: {route.accessibility.stairsUsed.join(', ')}</Text>
          </View>
        )}
      </View>

      {/* Start Navigation CTA */}
      <TouchableOpacity
        style={[styles.startNavBtn, isWheelchair && styles.startNavBtnWheelchair]}
        onPress={onStartNavigation}
        activeOpacity={0.85}
      >
        <Text style={styles.startNavIcon}>🧭</Text>
        <Text style={styles.startNavText}>START TURN-BY-TURN GUIDANCE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  routePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  routePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8
  },
  accessibleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  accessibleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981'
  },
  stairsBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  stairsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444'
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fitBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569'
  },
  fitBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1'
  },
  closeBtn: {
    padding: 4
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold'
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  metricItem: {
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC'
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155'
  },
  verticalTransitionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  facilityPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  stairPill: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  facilityPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8'
  },
  startNavBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  startNavBtnWheelchair: {
    backgroundColor: '#0369A1'
  },
  startNavIcon: {
    fontSize: 16
  },
  startNavText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6
  }
});
