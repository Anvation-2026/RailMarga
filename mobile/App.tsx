import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AssistantChatScreen } from './src/screens/AssistantChatScreen';
import { FacilityFinderScreen } from './src/screens/FacilityFinderScreen';
import { PlatformDetailScreen } from './src/screens/PlatformDetailScreen';
import { QrScanScreen } from './src/screens/QrScanScreen';
import { useNavigationStore } from './src/store/navigationStore';
import { RouteResult } from './src/services/localRouter';

type ScreenName = 'home' | 'assistant' | 'facilities' | 'platformDetail' | 'qrScan';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);

  const { startNavigation, setDestinationNode } = useNavigationStore();

  const handleStartRouteFromAssistant = (route: RouteResult) => {
    setDestinationNode(route.destination);
    startNavigation(route);
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'assistant':
        return (
          <AssistantChatScreen
            onBack={() => setCurrentScreen('home')}
            onStartRoute={handleStartRouteFromAssistant}
          />
        );
      case 'facilities':
        return (
          <FacilityFinderScreen
            onBack={() => setCurrentScreen('home')}
            onNavigateToFacility={() => setCurrentScreen('home')}
          />
        );
      case 'platformDetail':
        return (
          <PlatformDetailScreen
            platform={selectedPlatform}
            onBack={() => setCurrentScreen('home')}
            onStartNavigate={() => setCurrentScreen('home')}
            onAskAssistant={() => setCurrentScreen('assistant')}
          />
        );
      case 'qrScan':
        return (
          <QrScanScreen
            onBack={() => setCurrentScreen('home')}
            onLocationUpdated={() => setCurrentScreen('home')}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            onOpenAssistant={() => setCurrentScreen('assistant')}
            onOpenFacilities={() => setCurrentScreen('facilities')}
            onOpenPlatformDetail={(platform) => {
              setSelectedPlatform(platform);
              setCurrentScreen('platformDetail');
            }}
            onOpenQrScan={() => setCurrentScreen('qrScan')}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  }
});
