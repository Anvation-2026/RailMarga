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
  Alert,
  useWindowDimensions,
  Platform
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
import { Colors, Shadows, Radii, Spacing } from '../theme/tokens';
import {
  CompassIcon,
  TrainIcon,
  SparkleIcon,
  QrIcon,
  AlertIcon,
  ArrowRightIcon,
  FullscreenIcon,
  CheckIcon,
  LayersIcon
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
  const [selectedMapLevel, setSelectedMapLevel] = useState<number | 'all'>('all');

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
        scrollRef.current.scrollTo({ y: isDesktop ? 180 : 460, animated: true });
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
      details: `Track bed and passenger boarding surface for Platform ${platform.number}. Serves departures and arrivals.`,
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
      details: facility.description || `${facility.name} located at KSR Bengaluru Station.`,
      status: facility.status,
      node
    });
  };

  // Quick action badges handler
  const handleQuickAction = async (category: string) => {
    let targetNode: StationNode | undefined;
    if (category === 'LIFT') {
      targetNode = localRouter.nodeDict.get('node_pf8_lift1') || localRouter.nodeDict.get('node_lift1');
    } else if (category === 'TOILET' || category === 'ACCESSIBLE_TOILET') {
      targetNode = localRouter.nodeDict.get('node_t1_toilet');
    } else if (category === 'METRO') {
      targetNode = localRouter.nodeDict.get('node_entry_t3_metro');
    } else if (category === 'TICKET_COUNTER') {
      targetNode = localRouter.nodeDict.get('node_t1_ticket');
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

  // Handle primary "GET ROUTE DIRECTIONS" action
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
            <Text style={styles.backBtnText}>← Return to Overview</Text>
          </TouchableOpacity>
          <Text style={styles.fullscreenTitle}>KSR Bengaluru Vector Map</Text>
          <TouchableOpacity onPress={() => setDemoModalVisible(true)} style={styles.alertPill} activeOpacity={0.8}>
            <AlertIcon size={14} color="#D97706" />
            <Text style={styles.alertPillText}>Simulate Alerts</Text>
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

      {/* TOP TRANSIT APP BAR */}
      {isNavigating && activeRoute ? (
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.navHeaderBackBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navHeaderBackText}>← Exit Guidance</Text>
          </TouchableOpacity>
          <View style={styles.navHeaderInfo}>
            <Text style={styles.navHeaderDest} numberOfLines={1}>
              Navigating to: {activeRoute.destination.name}
            </Text>
            <Text style={styles.navHeaderStats}>
              {activeRoute.estimatedTimeMinutes} min • {activeRoute.totalDistanceMeters}m • Step {currentStepIndex + 1}/{activeRoute.steps.length}
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
            {/* Left: Brand Identity */}
            <View style={styles.brandContainer}>
              <Image
                source={require('../../assets/railmarga-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <View style={styles.stationBadge}>
                <Text style={styles.stationBadgeCode}>SBC HUB</Text>
                <Text style={styles.stationBadgeName}>KSR Bengaluru</Text>
              </View>
            </View>

            {/* Center Desktop Navigation Tabs */}
            {isDesktop && (
              <View style={styles.desktopNavTabs}>
                <View style={[styles.desktopTabItem, styles.desktopTabItemActive]}>
                  <CompassIcon size={16} color="#2563EB" />
                  <Text style={[styles.desktopTabLabel, styles.desktopTabLabelActive]}>Navigation & Map</Text>
                </View>
                <TouchableOpacity
                  style={styles.desktopTabItem}
                  onPress={onOpenFacilities}
                  activeOpacity={0.7}
                >
                  <TrainIcon size={16} color="#64748B" />
                  <Text style={styles.desktopTabLabel}>Station Directory</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.desktopTabItem}
                  onPress={onOpenAssistant}
                  activeOpacity={0.7}
                >
                  <SparkleIcon size={16} color="#64748B" />
                  <Text style={styles.desktopTabLabel}>AI Concierge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.desktopTabItem}
                  onPress={onOpenQrScan}
                  activeOpacity={0.7}
                >
                  <QrIcon size={16} color="#64748B" />
                  <Text style={styles.desktopTabLabel}>QR Checkpoint</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Right: Engine Status & Demo Alerts */}
            <View style={styles.headerRight}>
              <View style={[styles.statusChip, isOnline ? styles.statusOnline : styles.statusOffline]}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusText}>{isOnline ? 'Online Engine' : 'Offline Mode'}</Text>
              </View>

              <TouchableOpacity
                style={styles.alertActionBtn}
                onPress={() => setDemoModalVisible(true)}
                activeOpacity={0.8}
              >
                <AlertIcon size={14} color="#D97706" />
                <Text style={styles.alertActionText}>Simulate Alerts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.mainContainer, isDesktop && styles.desktopGrid]}>
          {/* ======================================================== */}
          {/* LEFT COLUMN: ROUTE PLANNER, PLATFORMS, PROFILES, RESULTS */}
          {/* ======================================================== */}
          <View style={[styles.plannerColumn, isDesktop && styles.plannerColumnDesktop]}>
            {/* Card 1: Journey Planner */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionMainTitle}>TRIP PLANNER</Text>
                <Text style={styles.sectionSubTitle}>KSR Bengaluru (SBC)</Text>
              </View>

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

              {/* Quick Platform Strip */}
              <View style={styles.platformSection}>
                <View style={styles.platformHeader}>
                  <Text style={styles.platformLabel}>PLATFORMS (1-TAP ROUTE)</Text>
                  <Text style={styles.platformTrackHint}>Tracks 1 to 10</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.platformChipsScroll}
                >
                  {PLATFORMS_LIST.map((pfNum) => {
                    const isSelected = destinationNode?.name.includes(`Platform ${pfNum}`);
                    return (
                      <TouchableOpacity
                        key={pfNum}
                        style={[styles.platformChip, isSelected && styles.platformChipActive]}
                        onPress={() => handleQuickPlatformSelect(pfNum)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.platformChipText, isSelected && styles.platformChipTextActive]}>
                          PF {pfNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Accessibility & Travel Profiles */}
              <ProfilePicker
                selectedProfileId={selectedProfile}
                onSelectProfile={(p) => {
                  setProfile(p);
                  if (startNode && destinationNode) {
                    scrollToResults();
                  }
                }}
              />

              {/* Primary CTA: GET ROUTE DIRECTIONS */}
              <TouchableOpacity
                style={styles.getRouteBtn}
                onPress={handleFindRoute}
                activeOpacity={0.85}
              >
                <Text style={styles.getRouteBtnText}>
                  {destinationNode ? 'GET ROUTE DIRECTIONS' : 'FIND OPTIMAL ROUTE'}
                </Text>
                <ArrowRightIcon size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Route Results & Turn Guidance Card */}
            {activeRoute && !isNavigating && (
              <View nativeID="route-results-section" style={styles.resultsCardWrapper}>
                <View style={styles.routeResultsHeaderRow}>
                  <Text style={styles.routeResultsTitle}>COMPUTED INDOOR ROUTE</Text>
                  <TouchableOpacity
                    style={styles.clearRouteBtn}
                    onPress={() => {
                      setStartNode(null);
                      setDestinationNode(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearRouteBtnText}>Clear Route</Text>
                  </TouchableOpacity>
                </View>

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

            {/* Essential Amenities Bar */}
            <View style={styles.sectionCard}>
              <QuickActionBadges onSelectAction={handleQuickAction} />
            </View>
          </View>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: INTERACTIVE CAD MAP & LIVE STATION STATUS  */}
          {/* ======================================================== */}
          <View
            nativeID="map-card-section"
            style={[styles.mapColumn, isDesktop && styles.mapColumnDesktop]}
          >
            {/* Map Container Card */}
            <View style={styles.mapCard}>
              {/* Map Header */}
              <View style={styles.mapHeaderRow}>
                <View>
                  <Text style={styles.mapTitle}>STATION VECTOR BLUEPRINT</Text>
                  <Text style={styles.mapSub}>Original CAD Geometry • SBC Layout</Text>
                </View>
                <View style={styles.mapHeaderActions}>
                  <TouchableOpacity
                    style={styles.fullscreenToggleBtn}
                    onPress={() => setIsFullscreenMap(true)}
                    activeOpacity={0.8}
                  >
                    <FullscreenIcon size={14} color="#2563EB" />
                    <Text style={styles.fullscreenToggleText}>Fullscreen</Text>
                  </TouchableOpacity>
                </View>
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

            {/* Station Concierge Quick Cards (Mobile & Desktop) */}
            <View style={styles.conciergeCardsRow}>
              <TouchableOpacity
                style={styles.conciergeCard}
                onPress={onOpenAssistant}
                activeOpacity={0.85}
              >
                <View style={styles.conciergeIconBox}>
                  <SparkleIcon size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.conciergeTag}>GROUNDED AI</Text>
                  <Text style={styles.conciergeTitle}>Ask Station Assistant</Text>
                  <Text style={styles.conciergeSub}>Gates, lifts, trains & directions</Text>
                </View>
                <Text style={styles.conciergeArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.conciergeCard}
                onPress={onOpenFacilities}
                activeOpacity={0.85}
              >
                <View style={[styles.conciergeIconBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <TrainIcon size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.conciergeTag, { color: '#059669' }]}>42 AMENITIES</Text>
                  <Text style={styles.conciergeTitle}>Station Directory</Text>
                  <Text style={styles.conciergeSub}>Lifts, waiting halls & restrooms</Text>
                </View>
                <Text style={styles.conciergeArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: isNavigating ? 260 : 60 }} />
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
    backgroundColor: '#F8FAFC'
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10
  },
  headerInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  brandLogo: {
    width: 104,
    height: 32
  },
  stationBadge: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 10
  },
  stationBadgeCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5
  },
  stationBadgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  desktopNavTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: Radii.pill
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
    backgroundColor: '#FFFFFF',
    ...Shadows.sm
  },
  desktopTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  desktopTabLabelActive: {
    color: '#2563EB',
    fontWeight: '700'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#F1F5F9'
  },
  statusOnline: {
    backgroundColor: '#ECFDF5'
  },
  statusOffline: {
    backgroundColor: '#FFFBEB'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  alertActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706'
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.sm
  },
  mainContainer: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center'
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20
  },
  plannerColumn: {
    width: '100%'
  },
  plannerColumnDesktop: {
    width: 480
  },
  mapColumn: {
    width: '100%',
    marginTop: 16
  },
  mapColumnDesktop: {
    flex: 1,
    marginTop: 0
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Shadows.sm
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionMainTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8
  },
  sectionSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8'
  },
  platformSection: {
    marginTop: 12,
    marginBottom: 8
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  platformLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5
  },
  platformTrackHint: {
    fontSize: 10,
    color: '#94A3B8'
  },
  platformChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2
  },
  platformChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  platformChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8'
  },
  platformChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  platformChipTextActive: {
    color: '#FFFFFF'
  },
  getRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: 12,
    ...Shadows.sm
  },
  getRouteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  resultsCardWrapper: {
    marginBottom: 16
  },
  routeResultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4
  },
  routeResultsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6
  },
  clearRouteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  clearRouteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
    marginBottom: 16
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  mapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6
  },
  mapSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  mapHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fullscreenToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  fullscreenToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB'
  },
  conciergeCardsRow: {
    flexDirection: 'row',
    gap: 12
  },
  conciergeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm
  },
  conciergeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  conciergeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5
  },
  conciergeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1
  },
  conciergeSub: {
    fontSize: 10,
    color: '#64748B'
  },
  conciergeArrow: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700'
  },
  bannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  navHeaderBackBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  navHeaderBackText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  navHeaderInfo: {
    flex: 1,
    alignItems: 'center'
  },
  navHeaderDest: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  navHeaderStats: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  navHeaderExitBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.sm
  },
  navHeaderExitText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  fullscreenSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB'
  },
  fullscreenTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  alertPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706'
  },
  floatingRouteCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 99
  }
});
