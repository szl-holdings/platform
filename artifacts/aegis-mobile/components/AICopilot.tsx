import React from "react";
import { AICopilotModal } from "@szl-holdings/mobile-ai";

const ACCENT = "#ef4444";
const DEFAULT_SYSTEM_CONTEXT = "You are Aegis, a unified defense and intelligence AI assistant with access to real-time threat feeds, decision workflows, and intelligence databases.";
const DEFAULT_AGENT_ID = "aegis";
const DEFAULT_AGENT_NAME = "Aegis Intelligence";
const AUTH_TOKEN_KEY = "aegis_auth_token";

interface AICopilotProps {
  visible: boolean;
  onClose: () => void;
  agentName?: string;
  agentId?: string;
  accentColor?: string;
  systemContext?: string;
  welcomeMessage?: string;
  suggestions?: string[];
}

export function AICopilot({
  visible,
  onClose,
  agentName = DEFAULT_AGENT_NAME,
  agentId = DEFAULT_AGENT_ID,
  accentColor = ACCENT,
  systemContext = DEFAULT_SYSTEM_CONTEXT,
  welcomeMessage,
  suggestions,
}: AICopilotProps) {
  return (
    <AICopilotModal
      visible={visible}
      onClose={onClose}
      agentName={agentName}
      agentId={agentId}
      accentColor={accentColor}
      systemContext={systemContext}
      authTokenKey={AUTH_TOKEN_KEY}
      welcomeMessage={welcomeMessage}
      suggestions={suggestions}
    />
  );
}
