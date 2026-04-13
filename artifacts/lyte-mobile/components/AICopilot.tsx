import React from "react";
import { AICopilotModal } from "@szl-holdings/mobile-ai";

const ACCENT = "#f97316";
const DEFAULT_SYSTEM_CONTEXT = "You are Lyte, an operations and command center AI assistant with access to operational data, workflows, and system metrics.";
const DEFAULT_AGENT_ID = "lyte";
const DEFAULT_AGENT_NAME = "Lyte Command";
const AUTH_TOKEN_KEY = "lyte_session_token";

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
