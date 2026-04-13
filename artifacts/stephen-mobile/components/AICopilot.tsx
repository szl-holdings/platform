import React from "react";
import { AICopilotModal } from "@szl-holdings/mobile-ai";

const ACCENT = "#6366f1";
const DEFAULT_SYSTEM_CONTEXT = "You are Stephen Lutar's personal AI assistant with access to creative projects, professional portfolio, and publication management tools.";
const DEFAULT_AGENT_ID = "stephen";
const DEFAULT_AGENT_NAME = "Stephen AI";
const AUTH_TOKEN_KEY = "stephen_auth_token";

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
