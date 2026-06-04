import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiBaseUrl } from '../env';

export interface MobileCopilotConfig {
  name: string;
  icon: string;
  agentId: string;
  accentColor: string;
  welcomeMessage: string;
  placeholderText?: string;
  suggestedQuestions?: string[];
  systemPrompt: string;
  conversationKey?: string;
  isAdvisoryAgent?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const API_BASE =
  getApiBaseUrl('https://szl-holdings.replit.app') ?? 'https://szl-holdings.replit.app';

function loadHistory(_key?: string): ChatMessage[] {
  return [];
}

function MessageBubble({ message, accentColor }: { message: ChatMessage; accentColor: string }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? [styles.bubbleUser, { backgroundColor: accentColor }] : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export function CopilotFab({ config }: { config: MobileCopilotConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadHistory(config.conversationKey),
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const fabScale = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (isOpen) scrollToEnd();
  }, [isOpen, scrollToEnd]);

  const openFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setIsOpen(true);
  };

  const sendMessage = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || isLoading) return;

      setInput('');
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: userText };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);
      setStreamingContent('');

      const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: config.systemPrompt },
        ...newMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      abortRef.current = new AbortController();

      try {
        const response = await fetch(`${API_BASE}/api/copilot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, agentId: config.agentId }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error('Network error');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream body');

        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                done?: boolean;
                error?: string;
              };
              if (parsed.content) {
                accumulated += parsed.content;
                setStreamingContent(accumulated);
              }
            } catch {}
          }
        }

        const finalContent = accumulated || "I'm here to help — could you rephrase that?";
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: finalContent,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          if (streamingContent) {
            setMessages((prev) => [
              ...prev,
              { id: `a-${Date.now()}`, role: 'assistant', content: streamingContent },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              content: "I'm having trouble connecting right now. Please try again.",
            },
          ]);
        }
        setStreamingContent('');
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, config, streamingContent],
  );

  const displayMessages: ChatMessage[] = streamingContent
    ? [...messages, { id: 'streaming', role: 'assistant', content: streamingContent }]
    : messages;

  const showWelcome = messages.length === 0 && !streamingContent;

  return (
    <>
      <Animated.View
        style={[
          styles.fab,
          { backgroundColor: config.accentColor, transform: [{ scale: fabScale }] },
        ]}
      >
        <TouchableOpacity onPress={openFab} style={styles.fabInner} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>{config.icon}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modal}>
          <View style={[styles.header, { borderBottomColor: `${config.accentColor}33` }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>{config.icon}</Text>
              <View>
                <Text style={styles.headerName}>{config.name}</Text>
                {config.isAdvisoryAgent && (
                  <Text style={[styles.advisoryBadge, { color: config.accentColor }]}>
                    Advisory Mode
                  </Text>
                )}
              </View>
            </View>
            <Pressable onPress={() => setIsOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={listRef}
              data={displayMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MessageBubble message={item} accentColor={config.accentColor} />
              )}
              contentContainerStyle={styles.messageList}
              ListHeaderComponent={
                showWelcome ? (
                  <View style={styles.welcomeContainer}>
                    <Text style={[styles.welcomeIcon, { color: config.accentColor }]}>
                      {config.icon}
                    </Text>
                    <Text style={styles.welcomeText}>{config.welcomeMessage}</Text>
                    {config.suggestedQuestions && config.suggestedQuestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        {config.suggestedQuestions.map((q, i) => (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.suggestionChip,
                              { borderColor: `${config.accentColor}66` },
                            ]}
                            onPress={() => sendMessage(q)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.suggestionText, { color: config.accentColor }]}>
                              {q}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : null
              }
              ListFooterComponent={
                isLoading && !streamingContent ? (
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={config.accentColor} />
                    <Text style={[styles.typingText, { color: config.accentColor }]}>
                      Thinking…
                    </Text>
                  </View>
                ) : null
              }
              onContentSizeChange={scrollToEnd}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { borderColor: `${config.accentColor}66` }]}
                value={input}
                onChangeText={setInput}
                placeholder={config.placeholderText ?? 'Ask anything…'}
                placeholderTextColor="#666"
                multiline
                maxLength={2000}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: input.trim() ? config.accentColor : `${config.accentColor}55`,
                  },
                ]}
                onPress={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>↑</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 24,
  },
  modal: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    backgroundColor: '#111',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  advisoryBadge: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#aaa',
    fontSize: 18,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: width * 0.78,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#1e1e1e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextAssistant: {
    color: '#e0e0e0',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  welcomeIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  welcomeText: {
    color: '#bbb',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 8,
    marginTop: 16,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111',
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#0d0d0d',
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
