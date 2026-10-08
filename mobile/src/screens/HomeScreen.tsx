import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { KsrMap } from '../components/KsrMap';
import { NavigationInputCard } from '../components/NavigationInputCard';
import { LocationSearchModal } from '../components/LocationSearchModal';
import { MapEntityModal, TappedEntity } from '../components/MapEntityModal';
import { RoutePreviewCard } from '../components/RoutePreviewCard';
import { ProfilePicker } from '../components/ProfilePicker';
import { QuickActionBadges } from '../components/QuickActionBadges';
import { NavigationBanner } from '../components/NavigationBanner';
import { BlockageModal } from '../components/BlockageModal';
import { useNavigationStore } from '../store/navigationStore';
import { StationNode, localRouter, Coordinates } from '../services/localRouter';
import { Colors, Radii, Spacing, Shadows } from '../theme/tokens';
import {
  BellIcon,
  CompassIcon,
  TrainIcon,
  SparkleIcon,
  QrIcon,
  ArrowRightIcon,
  FullscreenIcon,
  AlertIcon,
  CloseIcon
} from '../components/Icons';

interface HomeScreenProps {
  onOpenAssistant: () => void;
  onOpenFacilities: () => void;
  onOpenPlatformDetail: (platform: any) => void;
  onOpenQrScan: () => void;
}

const PLATFORMS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAssistant,
  onOpenFacilities,
  onOpenPlatformDetail,
  onOpenQrScan
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<'source' | 'destination'>('destination');
  const [demoModalVisible, setDemoModalVisible] = useState(false);
  const [tappedEntity, setTappedEntity] = useState<TappedEntity | null>(null);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [dismissAlertBanner, setDismissAlertBanner] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const {
    startNode,
    destinationNode,
    sourceMethod,
    destinationMethod,
    selectedProfile,
    activeRoute,
    currentStepIndex,
    isNavigating,
    isOnline,
    voiceEnabled,
    blockageAlert,
    mapSelectionMode,
    setStartNode,
    setDestinationNode,
    swapSourceAndDestination,
    setMapSelectionMode,
    setProfile,
    calculateRoute,
    startNavigation,
    stopNavigation,
    advanceStep,
    previousStep,
    toggleVoice,
    checkNetwork
  } = useNavigationStore();

  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll down to route directions and map results
  const scrollToResults = () => {
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const el = document.getElementById('route-results-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: isDesktop ? 'nearest' : 'start' });
          return;
        }
      }
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: isDesktop ? 180 : 380, animated: true });
      }
    }, 120);
  };

  // Open Search Modal
  const handleOpenSearch = (mode: 'source' | 'destination') => {
    setSearchMode(mode);
    setSearchModalVisible(true);
  };

  // Handle Location Selection from Search
  const handleSelectLocation = async (node: StationNode) => {
    if (searchMode === 'source') {
      setStartNode(node, 'SEARCH');
    } else {
      setDestinationNode(node, 'SEARCH');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
      scrollToResults();
    }
  };

  // Quick 1-tap Platform Selector
  const handleQuickPlatformSelect = async (pfNumber: number) => {
    const pfNode = localRouter.nodeDict.get(`node_pf${pfNumber}_center`) || localRouter.nodeDict.get(`node_pf${pfNumber}_west`);
    if (pfNode) {
      setDestinationNode(pfNode, 'PLATFORM');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
      scrollToResults();
    }
  };

  // Start Map Selection Mode
  const handleStartMapSelection = (mode: 'source' | 'destination') => {
    setMapSelectionMode(mode);
    scrollToResults();
  };

  // Handle Map Tap Coordinate
  const handleMapCoordinateSelected = (coords: Coordinates) => {
    const nearest = localRouter.findNearestNode(coords);
    if (!nearest) return;

    if (mapSelectionMode === 'source') {
      setStartNode(nearest.node, 'MAP');
      setMapSelectionMode('none');
    } else if (mapSelectionMode === 'destination') {
      setDestinationNode(nearest.node, 'MAP');
      setMapSelectionMode('none');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      calculateRoute().then(() => scrollToResults());
    }
  };

  // Handle Map Platform Tap
  const handlePlatformTapped = (platform: any) => {
    const node = localRouter.nodeDict.get(`node_pf${platform.number}_center`) || localRouter.nodes[0];
    setTappedEntity({
      type: 'PLATFORM',
      id: platform.id,
      name: `Platform ${platform.number}`,
      level: 0,
      wheelchairAccessible: true,
      details: `Platform ${platform.number} boarding area at KSR Bengaluru.`,
      node
    });
  };

  // Handle Map Facility Tap
  const handleFacilityTapped = (facility: any) => {
    const node = localRouter.nodeDict.get(`node_${facility.id}`) || localRouter.nodes[0];
    setTappedEntity({
      type: 'FACILITY',
      id: facility.id,
      name: facility.name,
      level: facility.level,
      wheelchairAccessible: facility.wheelchairAccessible,
      details: facility.description || `${facility.name} at KSR Bengaluru.`,
      status: facility.status,
      node
    });
  };

  // Quick action badges handler (4-column amenity grid)
  const handleQuickAction = async (category: string) => {
    let targetNode: StationNode | undefined;
    if (category === 'LIFT') {
      targetNode = localRouter.nodeDict.get('node_pf8_lift1') || localRouter.nodeDict.get('node_lift1');
    } else if (category === 'TOILET' || category === 'ACCESSIBLE_TOILET') {
      targetNode = localRouter.nodeDict.get('node_t1_toilet');
    } else if (category === 'WAITING_HALL') {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    } else if (category === 'FOOD') {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    } else if (category === 'ATM') {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    } else if (category === 'TICKET_COUNTER') {
      targetNode = localRouter.nodeDict.get('node_t1_ticket');
    } else if (category === 'CLOAK_ROOM') {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    } else if (category === 'HELP_DESK') {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    } else {
      targetNode = localRouter.nodeDict.get('node_entry_t1_main_east');
    }

    if (targetNode) {
      setDestinationNode(targetNode, 'FACILITY');
      if (!startNode) {
        const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
        if (defaultStart) {
          setStartNode(defaultStart, 'SEARCH');
        }
      }
      await calculateRoute();
      scrollToResults();
    }
  };

  // Handle primary "Find route" action
  const handleFindRoute = async () => {
    if (!destinationNode) {
      handleOpenSearch('destination');
      return;
    }
    if (!startNode) {
      const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
      if (defaultStart) {
        setStartNode(defaultStart, 'SEARCH');
      } else {
        handleOpenSearch('source');
        return;
      }
    }
    await calculateRoute();
    scrollToResults();
  };

  // Fullscreen Map Mode
  if (isFullscreenMap) {
    return (
      <SafeAreaView style={styles.fullscreenSafe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity onPress={() => setIsFullscreenMap(false)} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Return to overview</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>Station blueprint</Text>
          <TouchableOpacity onPress={() => setDemoModalVisible(true)} style={styles.alertPill} activeOpacity={0.8}>
            <BellIcon size={16} color="#1A1A1A" />
            <Text style={styles.alertPillText}>Alerts</Text>
          </TouchableOpacity>
        </View>

        <KsrMap
          routeCoordinates={activeRoute?.pathGeometry}
          currentLocation={startNode?.coordinates}
          destinationLocation={destinationNode?.coordinates}
          onSelectPlatform={handlePlatformTapped}
          onSelectFacility={handleFacilityTapped}
          onSelectMapCoordinate={handleMapCoordinateSelected}
          selectionMode={mapSelectionMode}
          onCancelSelection={() => setMapSelectionMode('none')}
          isFullscreen={true}
          onToggleFullscreen={() => setIsFullscreenMap(false)}
        />

        {activeRoute && (
          <View style={styles.floatingRouteCard}>
            <RoutePreviewCard
              route={activeRoute}
              selectedProfileId={selectedProfile}
              onStartNavigation={() => {
                setIsFullscreenMap(false);
                startNavigation();
              }}
              onFitRoute={() => {}}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP QUICK-COMMERCE STICKY APP BAR */}
      {isNavigating && activeRoute ? (
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.navHeaderBackBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderBackText}>← Exit</Text>
          </TouchableOpacity>
          <View style={styles.navHeaderInfo}>
            <Text style={styles.navHeaderDest} numberOfLines={1}>
              {activeRoute.destination.name}
            </Text>
            <Text style={styles.navHeaderStats}>
              {activeRoute.estimatedTimeMinutes} min · {activeRoute.totalDistanceMeters}m · Step {currentStepIndex + 1}/{activeRoute.steps.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navHeaderExitBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderExitText}>Finish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.headerInner}>
            {/* Left: Brand Identity + SBC Station Pill */}
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/railmarga-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <View style={styles.stationPill}>
                <Text style={styles.stationPillText}>KSR Bengaluru · SBC</Text>
              </View>
            </View>

            {/* Center Desktop Navigation Tabs */}
            {isDesktop && (
              <View style={styles.desktopNavTabs}>
                <View style={[styles.desktopTabItem, styles.desktopTabItemActive]}>
                  <CompassIcon size={16} color="#1A1A1A" strokeWidth={2} />
                  <Text style={[styles.desktopTabLabel, styles.desktopTabLabelActive]}>Navigation</Text>
                </View>
                <TouchableOpacity
                  style={styles.desktopTabItem}
                  onPress={onOpenFacilities}
                  activeOpacity={0.7}
                >
                  <TrainIcon size={16} color="#666660" strokeWidth={1.75} />
                  <Text style={styles.desktopTabLabel}>Directory</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.desktopTabItem}
                  onPress={onOpenAssistant}
                  activeOpacity={0.7}
                >
                  <SparkleIcon size={16} color="#666660" strokeWidth={1.75} />
                  <Text style={styles.desktopTabLabel}>Assistant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.desktopTabItem}
                  onPress={onOpenQrScan}
                  activeOpacity={0.7}
                >
                  <QrIcon size={16} color="#666660" strokeWidth={1.75} />
                  <Text style={styles.desktopTabLabel}>Scan QR</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Right: Alerts Bell with Red Dot & Online Status */}
            <View style={styles.headerRight}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#16A34A' : '#D97706' }]} />
                <Text style={styles.statusPillText}>{isOnline ? 'Online' : 'Offline'}</Text>
              </View>

              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => setDemoModalVisible(true)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Station alerts and simulation"
              >
                <BellIcon size={20} color="#1A1A1A" strokeWidth={1.75} />
                <View style={styles.redDot} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Slim Blinkit-style Alert Notice Banner (Dismissible) */}
      {blockageAlert && !dismissAlertBanner && (
        <View style={styles.alertBanner}>
          <AlertIcon size={16} color="#DC2626" strokeWidth={2} />
          <Text style={styles.alertBannerText} numberOfLines={1}>
            Lift 1 under maintenance. Accessible rerouting active.
          </Text>
          <TouchableOpacity
            onPress={() => setDismissAlertBanner(true)}
            style={styles.alertDismissBtn}
            activeOpacity={0.7}
          >
            <CloseIcon size={14} color="#666660" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
          {/* ======================================================== */}
          {/* LEFT COLUMN: QUICK COMMERCE TRIP PLANNER & AMENITIES     */}
          {/* ======================================================== */}
          <View style={[styles.plannerColumn, isDesktop && styles.plannerColumnDesktop]}>
            {/* Card 1: Journey Search & Chips */}
            <View style={styles.card}>
              {/* Primary Search Bar */}
              <NavigationInputCard
                startNode={startNode}
                destinationNode={destinationNode}
                sourceMethod={sourceMethod}
                destinationMethod={destinationMethod}
                onOpenSourceSearch={() => handleOpenSearch('source')}
                onOpenDestinationSearch={() => handleOpenSearch('destination')}
                onSelectSourceOnMap={() => handleStartMapSelection('source')}
                onSelectDestinationOnMap={() => handleStartMapSelection('destination')}
                onOpenQrScan={onOpenQrScan}
                onSwap={swapSourceAndDestination}
                onClearSource={() => setStartNode(null)}
                onClearDestination={() => setDestinationNode(null)}
              />

              {/* Horizontal Platform Chips (PF 1 to PF 10, min 44px tap target) */}
              <View style={styles.platformsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Running late? Tap your platform</Text>
                  <Text style={styles.sectionHint}>PF 1 – 10</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.platformChipsRow}
                >
                  {PLATFORMS_LIST.map((pfNum) => {
                    const isSelected = destinationNode?.name.includes(`Platform ${pfNum}`);
                    return (
                      <TouchableOpacity
                        key={pfNum}
                        style={[styles.platformChip, isSelected && styles.platformChipActive]}
                        onPress={() => handleQuickPlatformSelect(pfNum)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`Select Platform ${pfNum}`}
                      >
                        <Text style={[styles.platformChipText, isSelected && styles.platformChipTextActive]}>
                          PF {pfNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Accessibility Segmented Pills */}
              <ProfilePicker
                selectedProfileId={selectedProfile}
                onSelectProfile={(p) => {
                  setProfile(p);
                  if (startNode && destinationNode) {
                    scrollToResults();
                  }
                }}
              />

              {/* Primary Golden Yellow CTA */}
              <TouchableOpacity
                style={styles.findRouteBtn}
                onPress={handleFindRoute}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.findRouteText}>
                  {destinationNode ? 'Get directions' : 'Find route'}
                </Text>
                <ArrowRightIcon size={18} color="#1A1A1A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Route Results & Turn Guidance Card */}
            {activeRoute && !isNavigating && (
              <View nativeID="route-results-section" style={{ width: '100%' }}>
                <RoutePreviewCard
                  route={activeRoute}
                  selectedProfileId={selectedProfile}
                  onStartNavigation={() => startNavigation()}
                  onFitRoute={() => {}}
                  onClosePreview={() => {
                    setStartNode(null);
                    setDestinationNode(null);
                  }}
                />
              </View>
            )}

            {/* Essential Amenities Grid (4-Column Blinkit Category Tiles) */}
            <View style={styles.card}>
              <QuickActionBadges onSelectAction={handleQuickAction} />
            </View>
          </View>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: INTERACTIVE CAD MAP & STATION BLUEPRINT    */}
          {/* ======================================================== */}
          <View
            nativeID="map-card-section"
            style={[styles.mapColumn, isDesktop && styles.mapColumnDesktop]}
          >
            {/* Map Container Card */}
            <View style={styles.mapCard}>
              <View style={styles.mapCardHeader}>
                <View>
                  <Text style={styles.mapCardTitle}>Station blueprint</Text>
                  <Text style={styles.mapCardSub}>Interactive indoor layout</Text>
                </View>
                <TouchableOpacity
                  style={styles.fullscreenBtn}
                  onPress={() => setIsFullscreenMap(true)}
                  activeOpacity={0.8}
                  accessibilityLabel="Toggle fullscreen map"
                >
                  <FullscreenIcon size={14} color="#1A1A1A" strokeWidth={2} />
                  <Text style={styles.fullscreenBtnText}>Fullscreen</Text>
                </TouchableOpacity>
              </View>

              {/* Interactive Vector Map */}
              <KsrMap
                routeCoordinates={activeRoute?.pathGeometry}
                currentLocation={startNode?.coordinates}
                destinationLocation={destinationNode?.coordinates}
                onSelectPlatform={handlePlatformTapped}
                onSelectFacility={handleFacilityTapped}
                onSelectMapCoordinate={handleMapCoordinateSelected}
                selectionMode={mapSelectionMode}
                onCancelSelection={() => setMapSelectionMode('none')}
                isFullscreen={false}
                onToggleFullscreen={() => setIsFullscreenMap(true)}
              />
            </View>

            {/* Quick Action Tiles for Assistant & Directory */}
            <View style={styles.conciergeCardsRow}>
              <TouchableOpacity
                style={styles.quickNavTile}
                onPress={onOpenAssistant}
                activeOpacity={0.85}
              >
                <View style={styles.quickNavIconBox}>
                  <SparkleIcon size={18} color="#1A1A1A" strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickNavTitle}>Ask assistant</Text>
                  <Text style={styles.quickNavSub}>Platforms, lifts & trains</Text>
                </View>
                <Text style={styles.quickNavArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavTile}
                onPress={onOpenFacilities}
                activeOpacity={0.85}
              >
                <View style={[styles.quickNavIconBox, { backgroundColor: '#EAF7EE' }]}>
                  <TrainIcon size={18} color="#16A34A" strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickNavTitle}>Station directory</Text>
                  <Text style={styles.quickNavSub}>42 amenities at SBC</Text>
                </View>
                <Text style={styles.quickNavArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: isNavigating ? 260 : 70 }} />
      </ScrollView>

      {/* Turn-by-Turn Navigation Overlay Banner */}
      {isNavigating && activeRoute && (
        <View style={styles.bannerContainer}>
          <NavigationBanner
            route={activeRoute}
            currentStepIndex={currentStepIndex}
            voiceEnabled={voiceEnabled}
            blockageAlert={blockageAlert}
            onAdvanceStep={advanceStep}
            onPreviousStep={previousStep}
            onToggleVoice={toggleVoice}
            onStopNavigation={stopNavigation}
          />
        </View>
      )}

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={searchModalVisible}
        mode={searchMode}
        onClose={() => setSearchModalVisible(false)}
        onSelectNode={handleSelectLocation}
      />

      {/* Interactive Entity Details Bottom Sheet */}
      <MapEntityModal
        entity={tappedEntity}
        onClose={() => setTappedEntity(null)}
        onSetAsStart={(node) => setStartNode(node, 'PLATFORM')}
        onSetAsDestination={(node) => setDestinationNode(node, 'PLATFORM')}
        onNavigateHere={async (node) => {
          setDestinationNode(node, 'PLATFORM');
          if (!startNode) {
            const defaultStart = localRouter.nodeDict.get('node_entry_t1_main_east');
            if (defaultStart) {
              setStartNode(defaultStart, 'SEARCH');
            }
          }
          await calculateRoute();
          scrollToResults();
        }}
      />

      {/* Station Conditions & Demo Sandbox Modal */}
      <BlockageModal
        visible={demoModalVisible}
        onClose={() => setDemoModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary // #F5F5F2
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandLogo: {
    width: 28,
    height: 28
  },
  stationPill: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  stationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  desktopNavTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border
  },
  desktopTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill
  },
  desktopTabItemActive: {
    backgroundColor: Colors.primary // Hero Golden Yellow
  },
  desktopTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  desktopTabLabelActive: {
    color: '#1A1A1A',
    fontWeight: '700'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.error
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8
  },
  alertBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626'
  },
  alertDismissBtn: {
    padding: 4
  },
  scrollContent: {
    padding: Spacing.md
  },
  mainLayout: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    flexDirection: 'column',
    gap: Spacing.md
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  plannerColumn: {
    width: '100%',
    gap: Spacing.md
  },
  plannerColumnDesktop: {
    width: 440,
    flexShrink: 0
  },
  mapColumn: {
    width: '100%',
    gap: Spacing.md
  },
  mapColumnDesktop: {
    flex: 1
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card, // 12px
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md
  },
  platformsSection: {
    marginVertical: Spacing.xs
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 2
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary
  },
  platformChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  platformChip: {
    height: 44, // Minimum 44px tap target
    minWidth: 54,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  platformChipActive: {
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderColor: Colors.primary
  },
  platformChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  platformChipTextActive: {
    color: '#1A1A1A',
    fontWeight: '800'
  },
  findRouteBtn: {
    height: 48,
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderRadius: Radii.pill, // 999px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm
  },
  findRouteText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  mapCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  mapCardSub: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  fullscreenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  conciergeCardsRow: {
    flexDirection: 'row',
    gap: 12
  },
  quickNavTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12
  },
  quickNavIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickNavTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  quickNavSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1
  },
  quickNavArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  navHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 10
  },
  navHeaderBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  navHeaderBackText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  navHeaderInfo: {
    flex: 1
  },
  navHeaderDest: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  navHeaderStats: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  navHeaderExitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  navHeaderExitText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error
  },
  fullscreenSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  fullscreenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border
  },
  alertPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  floatingRouteCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12
  }
});
