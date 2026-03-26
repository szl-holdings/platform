import React, { useState, useRef, useEffect, useCallback } from "react";
import { colors, effects, typography } from "./tokens";

export interface CopilotConfig {
  name: string;
  icon: string;
  systemPrompt: string;
  accentColor: string;
  welcomeMessage: string;
  placeholderText?: string;
  suggestedQuestions?: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0.75rem 0 0.25rem", color: colors.text.primary }}>
          {processInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} style={{ fontWeight: 700, fontSize: "1rem", margin: "0.75rem 0 0.25rem", color: colors.text.primary }}>
          {processInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginLeft: "0.5rem", marginBottom: "0.125rem" }}>
          <span style={{ color: colors.text.muted, flexShrink: 0 }}>•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/)!;
      elements.push(
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginLeft: "0.5rem", marginBottom: "0.125rem" }}>
          <span style={{ color: colors.text.muted, flexShrink: 0, fontSize: "0.8rem" }}>{match[1]}.</span>
          <span>{processInline(match[2]!)}</span>
        </div>
      );
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      elements.push(
        <pre key={i} style={{
          background: "hsla(220, 20%, 10%, 0.8)",
          borderRadius: "0.375rem",
          padding: "0.75rem",
          margin: "0.5rem 0",
          fontSize: "0.8rem",
          fontFamily: typography.fontFamily.mono,
          overflowX: "auto",
          border: `1px solid ${colors.border.DEFAULT}`,
        }}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "0.5rem" }} />);
    } else {
      elements.push(<p key={i} style={{ margin: "0.125rem 0", lineHeight: 1.6 }}>{processInline(line)}</p>);
    }
  }

  return <>{elements}</>;
}

function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const m = match[0]!;
    if (m.startsWith("`")) {
      parts.push(
        <code key={match.index} style={{
          background: "hsla(220, 20%, 20%, 0.5)",
          padding: "0.1rem 0.35rem",
          borderRadius: "0.25rem",
          fontSize: "0.85em",
          fontFamily: typography.fontFamily.mono,
        }}>
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("**")) {
      parts.push(<strong key={match.index} style={{ fontWeight: 600 }}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    }
    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function TypingIndicator({ accentColor }: { accentColor: string }) {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "0.5rem 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: accentColor,
            opacity: 0.6,
            animation: `copilotBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function AgentCopilot({ config }: { config: CopilotConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeChat = useCallback(async (userContent: string, currentMessages: ChatMessage[]) => {
    const userMsg: ChatMessage = { role: "user", content: userContent };
    const newMessages = [...currentMessages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    const apiMessages = [
      { role: "system" as const, content: config.systemPrompt },
      ...newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/intelligence/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let hadError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { content?: string; error?: string };
            if (parsed.error) {
              hadError = true;
            } else if (parsed.content) {
              accumulated += parsed.content;
              setStreamingContent(accumulated);
            }
          } catch {
            continue;
          }
        }
      }

      if (hadError && !accumulated) {
        throw new Error("Server reported stream error");
      }

      setMessages([...newMessages, { role: "assistant", content: accumulated || "I'm here to help! Could you rephrase that?" }]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages([...newMessages, { role: "assistant", content: streamingContent || "Response cancelled." }]);
      } else {
        try {
          const fallbackRes = await fetch("/api/intelligence/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: apiMessages }),
          });
          if (fallbackRes.ok) {
            const result = await fallbackRes.json() as { content: string };
            setMessages([...newMessages, { role: "assistant", content: result.content }]);
          } else {
            throw new Error("Fallback failed");
          }
        } catch {
          setMessages([...newMessages, { role: "assistant", content: config.welcomeMessage }]);
        }
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }, [config.systemPrompt, config.welcomeMessage, streamingContent]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    await executeChat(trimmed, messages);
  };

  const handleSuggestion = (q: string) => {
    if (isStreaming) return;
    executeChat(q, messages);
  };

  const fabStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "1.5rem",
    right: "1.5rem",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}dd)`,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    boxShadow: `0 4px 20px ${config.accentColor}40, ${effects.shadow.lg}`,
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    zIndex: 9998,
    color: "#fff",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(420px, 100vw)",
    height: "100vh",
    background: "hsla(220, 20%, 6%, 0.95)",
    backdropFilter: "blur(40px) saturate(1.8)",
    borderLeft: `1px solid hsla(220, 20%, 40%, 0.2)`,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    fontFamily: typography.fontFamily.body,
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "hsla(220, 20%, 4%, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 9998,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
  };

  return (
    <>
      <style>{`
        @keyframes copilotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes copilotFabPulse {
          0%, 100% { box-shadow: 0 4px 20px ${config.accentColor}40; }
          50% { box-shadow: 0 4px 30px ${config.accentColor}60; }
        }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={fabStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = `0 6px 30px ${config.accentColor}60, ${effects.shadow.xl}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = `0 4px 20px ${config.accentColor}40, ${effects.shadow.lg}`;
          }}
          aria-label={`Open ${config.name} AI Copilot`}
        >
          {config.icon}
        </button>
      )}

      <div style={overlayStyle} onClick={() => setIsOpen(false)} data-testid="copilot-overlay" />

      <div style={panelStyle} data-testid="copilot-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: `1px solid ${colors.border.DEFAULT}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(180deg, hsla(220, 20%, 10%, 0.8) 0%, transparent 100%)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${config.accentColor}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.125rem",
            }}>
              {config.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: colors.text.primary }}>{config.name}</div>
              <div style={{ fontSize: "0.75rem", color: colors.text.muted }}>AI Copilot</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            data-testid="copilot-close"
            aria-label="Close copilot"
            style={{
              background: "transparent",
              border: "none",
              color: colors.text.muted,
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              fontSize: "1.25rem",
              lineHeight: 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.surface.glass;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = colors.text.muted;
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {messages.length === 0 && !isStreaming && (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                filter: "drop-shadow(0 0 8px hsla(0, 0%, 100%, 0.1))",
              }}>
                {config.icon}
              </div>
              <div style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: colors.text.primary,
                marginBottom: "0.5rem",
              }}>
                {config.name}
              </div>
              <div style={{
                fontSize: "0.8125rem",
                color: colors.text.secondary,
                lineHeight: 1.5,
                maxWidth: "280px",
                margin: "0 auto 1.5rem",
              }}>
                {config.welcomeMessage}
              </div>
              {config.suggestedQuestions && config.suggestedQuestions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {config.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(q)}
                      data-testid={`copilot-suggestion-${i}`}
                      style={{
                        background: colors.surface.glass,
                        border: `1px solid ${colors.border.DEFAULT}`,
                        borderRadius: "0.625rem",
                        padding: "0.625rem 1rem",
                        color: colors.text.secondary,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.surface.glassHover;
                        e.currentTarget.style.borderColor = `${config.accentColor}40`;
                        e.currentTarget.style.color = colors.text.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.surface.glass;
                        e.currentTarget.style.borderColor = colors.border.DEFAULT;
                        e.currentTarget.style.color = colors.text.secondary;
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "0.75rem 1rem",
                borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                background: msg.role === "user"
                  ? `${config.accentColor}20`
                  : colors.surface.glass,
                border: `1px solid ${msg.role === "user" ? `${config.accentColor}30` : colors.border.DEFAULT}`,
                fontSize: "0.8125rem",
                color: colors.text.primary,
                lineHeight: 1.5,
              }}
            >
              {msg.role === "assistant" ? <SimpleMarkdown content={msg.content} /> : msg.content}
            </div>
          ))}

          {isStreaming && (
            <div style={{
              alignSelf: "flex-start",
              maxWidth: "85%",
              padding: "0.75rem 1rem",
              borderRadius: "1rem 1rem 1rem 0.25rem",
              background: colors.surface.glass,
              border: `1px solid ${colors.border.DEFAULT}`,
              fontSize: "0.8125rem",
              color: colors.text.primary,
              lineHeight: 1.5,
            }}>
              {streamingContent ? (
                <SimpleMarkdown content={streamingContent} />
              ) : (
                <TypingIndicator accentColor={config.accentColor} />
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: "1rem 1.25rem",
          borderTop: `1px solid ${colors.border.DEFAULT}`,
          background: "hsla(220, 20%, 8%, 0.6)",
        }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={config.placeholderText ?? `Ask ${config.name}...`}
              disabled={isStreaming}
              style={{
                flex: 1,
                background: colors.surface.glass,
                border: `1px solid ${colors.border.DEFAULT}`,
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                color: colors.text.primary,
                fontSize: "0.8125rem",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${config.accentColor}50`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.border.DEFAULT; }}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "0.75rem",
                background: input.trim() && !isStreaming ? config.accentColor : colors.surface.glass,
                border: "none",
                color: input.trim() && !isStreaming ? "#fff" : colors.text.muted,
                cursor: input.trim() && !isStreaming ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
          <div style={{
            textAlign: "center",
            fontSize: "0.6875rem",
            color: colors.text.muted,
            marginTop: "0.5rem",
            opacity: 0.6,
          }}>
            Powered by SZL Intelligence
          </div>
        </div>
      </div>
    </>
  );
}
