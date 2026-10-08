import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { apiService } from '../services/apiService';
import { RouteResult } from '../services/localRouter';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  route?: RouteResult | null;
  facility?: any;
  timestamp: string;
}

interface AssistantChatScreenProps {
  onBack: () => void;
  onStartRoute: (route: RouteResult) => void;
}

export const AssistantChatScreen: React.FC<AssistantChatScreenProps> = ({
  onBack,
  onStartRoute
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_welcome',
      sender: 'assistant',
      text: "Namaskara! I am RailMarga Assistant, your official AI guide for KSR Bengaluru Railway Station. How can I assist you with platforms, lifts, or accessible navigation today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const { startNode, selectedProfile } = useNavigationStore();

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setLoading(true);

    try {
      const resp = await apiService.queryAssistant(textToSend, {
        currentNodeId: startNode?.id,
        profileId: selectedProfile
      });

      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: resp.reply,
        route: resp.route || null,
        facility: resp.facility || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_err_${Date.now()}`,
          sender: 'assistant',
          text: "I am having trouble connecting to online services. You can still use deterministic navigation for Platforms 1 to 10.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "I'm using a wheelchair and need Platform 8",
    "Find nearest restroom",
    "Where is the nearest lift?",
    "Take me to Metro",
    "Lift 1 is blocked, give another route"
  ];

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>

          {/* Interactive Route Card inside chat */}
          {item.route && (
            <View style={styles.chatRouteCard}>
              <View style={styles.routeCardHeader}>
                <Text style={styles.routeIcon}>
                  {item.route.accessibility.wheelchairAccessible ? '♿' : '🧭'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeDestTitle}>
                    {item.route.destination.name}
                  </Text>
                  <Text style={styles.routeStats}>
                    {item.route.totalDistanceMeters}m • ~{item.route.estimatedTimeMinutes} min • {item.route.steps.length} steps
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startNavBtn}
                onPress={() => onStartRoute(item.route!)}
                activeOpacity={0.8}
              >
                <Text style={styles.startNavBtnText}>START NAVIGATION →</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.msgTime}>{item.timestamp}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>RailMarga Assistant</Text>
          <Text style={styles.headerSub}>Grounded AI Indoor Navigator</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.loadingText}>RailMarga is consulting station graph...</Text>
          </View>
        )}

        {/* Quick Suggestion Pills */}
        <View style={styles.pillsRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickPrompts}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pill}
                onPress={() => handleSend(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.pillText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about platforms, routes, or facilities..."
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8
  },
  backBtnText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 14
  },
  headerTitleBox: {
    alignItems: 'center'
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold'
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 10
  },
  chatList: {
    padding: 14,
    gap: 12
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 6
  },
  userWrapper: {
    justifyContent: 'flex-end'
  },
  assistantWrapper: {
    justifyContent: 'flex-start'
  },
  msgBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12
  },
  userBubble: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155'
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: '#FFFFFF'
  },
  assistantText: {
    color: '#F1F5F9'
  },
  msgTime: {
    color: '#94A3B8',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4
  },
  chatRouteCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#0284C7'
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  routeIcon: {
    fontSize: 24
  },
  routeDestTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  routeStats: {
    color: '#38BDF8',
    fontSize: 11
  },
  startNavBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  startNavBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11
  },
  pillsRow: {
    paddingVertical: 6,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B'
  },
  pill: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  pillText: {
    color: '#E0F2FE',
    fontSize: 12
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0B1120',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: '#334155'
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
