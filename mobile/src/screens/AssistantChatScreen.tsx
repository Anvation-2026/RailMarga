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
import { Colors, Radii, Spacing } from '../theme/tokens';
import {
  SendIcon,
  ArrowRightIcon,
  CheckIcon,
  WheelchairIcon,
  WalkIcon
} from '../components/Icons';

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
      text: "Namaskara! I am your Station Assistant for KSR Bengaluru (SBC). Ask me about platforms, lifts, restrooms, or trains.",
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
          text: "I am having trouble connecting to online services. You can still use offline navigation for Platforms 1 to 10.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Which platform is Train 12627?",
    "Nearest lift",
    "Where is the washroom?",
    "Take me to Platform 8",
    "Step-free route to Platform 4"
  ];

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>

          {/* Structured Route Card */}
          {item.route && (
            <View style={styles.chatRouteCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeIconBox}>
                  {item.route.accessibility.stepFree ? (
                    <WheelchairIcon size={16} color="#1A1A1A" strokeWidth={2} />
                  ) : (
                    <WalkIcon size={16} color="#1A1A1A" strokeWidth={2} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>{item.route.destination.name}</Text>
                  <Text style={styles.routeMeta}>
                    {item.route.estimatedTimeMinutes} min · {item.route.totalDistanceMeters}m · {item.route.steps.length} steps
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startNavBtn}
                onPress={() => onStartRoute(item.route!)}
                activeOpacity={0.85}
              >
                <Text style={styles.startNavText}>Start navigation</Text>
                <ArrowRightIcon size={14} color="#1A1A1A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header (Zepto/WhatsApp support style) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Station assistant</Text>
          <View style={styles.headerStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active now · SBC Concierge</Text>
          </View>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#1A1A1A" />
            <Text style={styles.loadingText}>Finding best answer…</Text>
          </View>
        )}

        {/* Quick Reply Chips */}
        <View style={styles.quickPromptsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickPrompts}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.promptsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.promptChip}
                onPress={() => handleSend(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.promptText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Chat Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about platforms, gates, trains…"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.85}
          >
            <SendIcon size={16} color="#1A1A1A" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10
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
  headerInfo: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success
  },
  statusText: {
    fontSize: 11,
    color: Colors.textSecondary
  },
  keyboardContainer: {
    flex: 1
  },
  messagesList: {
    padding: Spacing.md,
    gap: 10
  },
  msgWrapper: {
    width: '100%',
    flexDirection: 'row'
  },
  userWrapper: {
    justifyContent: 'flex-end'
  },
  assistantWrapper: {
    justifyContent: 'flex-start'
  },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14
  },
  userBubble: {
    backgroundColor: '#FEF9E6', // Warm yellow wash
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: '#1A1A1A',
    fontWeight: '500'
  },
  assistantText: {
    color: Colors.textPrimary
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  userTimestamp: {
    color: '#8A7100'
  },
  assistantTimestamp: {
    color: Colors.textSecondary
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    marginLeft: Spacing.md,
    marginBottom: 4
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  chatRouteCard: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    marginTop: 8
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  routeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  routeMeta: {
    fontSize: 11,
    color: Colors.textSecondary
  },
  startNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary, // Hero Golden Yellow
    borderRadius: Radii.pill,
    paddingVertical: 8
  },
  startNavText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  quickPromptsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8
  },
  promptsList: {
    paddingHorizontal: Spacing.md,
    gap: 6
  },
  promptChip: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  promptText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary
  },
  inputBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FAFAF7',
    borderRadius: Radii.input, // 8px
    borderWidth: 1,
    borderColor: Colors.borderInput,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary, // Hero Golden Yellow
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    opacity: 0.5
  }
});
