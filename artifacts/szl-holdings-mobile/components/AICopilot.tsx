import React from "react";
import { AICopilotModal } from "@szl-holdings/mobile-ai";

const ACCENT = "#c9a84c";
const DEFAULT_SYSTEM_CONTEXT = "You are an SZL Holdings executive portfolio AI assistant with access to portfolio analytics, market intelligence, and investment decision tools.";
const DEFAULT_AGENT_ID = "szl";
const DEFAULT_AGENT_NAME = "SZL Holdings";
const AUTH_TOKEN_KEY = "szl_auth_token";

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
