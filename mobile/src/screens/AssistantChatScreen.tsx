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
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

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
          text: "I am having trouble connecting to online services. You can still use deterministic offline navigation for Platforms 1 to 10.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Take me to Platform 8",
    "Find nearest lift",
    "Is Lift 2 available?",
    "Why did my route change?",
    "Find an accessible route"
  ];

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>

          {/* Structured AI Navigation Card */}
          {item.route && (
            <View style={styles.chatRouteCard}>
              <View style={styles.routeCardHeader}>
                <View style={styles.routeIconWrapper}>
                  <Text style={styles.routeIcon}>
                    {item.route.accessibility.wheelchairAccessible ? '♿' : '🧭'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeDestTitle}>
                    {item.route.destination.name}
                  </Text>
                  <Text style={styles.routeStats}>
                    {item.route.totalDistanceMeters}m • {item.route.estimatedTimeMinutes} min • {item.route.steps.length} steps
                  </Text>
                  <Text style={styles.accessibleTag}>
                    {item.route.accessibility.stepFree ? '✓ 100% Step-free' : 'Standard route'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startNavBtn}
                onPress={() => onStartRoute(item.route!)}
                activeOpacity={0.85}
              >
                <Text style={styles.startNavBtnText}>START NAVIGATION</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>ASK RAILMARGA</Text>
          <Text style={styles.headerSub}>Your station navigation assistant</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Suggested Prompt Chips */}
        <View style={styles.chipsRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickPrompts}
            keyExtractor={(item, index) => `${item}_${index}`}
            contentContainerStyle={{ paddingHorizontal: Spacing.sm, gap: Spacing.xs }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.promptChip}
                onPress={() => handleSend(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.promptChipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Message Thread */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.goldPrimary} />
            <Text style={styles.loadingText}>RailMarga is thinking...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about platforms, lifts, accessible paths..."
            placeholderTextColor={Colors.textTertiary}
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
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13
  },
  headerTitleGroup: {
    alignItems: 'center'
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1
  },
  chipsRow: {
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  promptChip: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border
  },
  promptChipText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '500'
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm
  },
  msgWrapper: {
    marginVertical: 2
  },
  userWrapper: {
    alignItems: 'flex-end'
  },
  assistantWrapper: {
    alignItems: 'flex-start'
  },
  msgBubble: {
    maxWidth: '85%',
    padding: Spacing.sm,
    borderRadius: Radii.md
  },
  userBubble: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomRightRadius: 2
  },
  assistantBubble: {
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.goldPrimary,
    borderBottomLeftRadius: 2,
    ...Shadows.sm
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: Colors.textPrimary
  },
  assistantText: {
    color: Colors.textPrimary
  },
  msgTime: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  chatRouteCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs
  },
  routeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    backgroundColor: Colors.goldTintSolid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.goldLight
  },
  routeIcon: {
    fontSize: 16
  },
  routeDestTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  routeStats: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1
  },
  accessibleTag: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  startNavBtn: {
    backgroundColor: Colors.goldPrimary,
    borderRadius: Radii.button,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs
  },
  startNavBtnText: {
    color: Colors.charcoalPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.goldPrimary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    opacity: 0.35
  },
  sendBtnText: {
    color: Colors.charcoalPrimary,
    fontSize: 18,
    fontWeight: '800'
  }
});
