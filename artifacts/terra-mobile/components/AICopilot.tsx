import React from "react";
import { AICopilotModal } from "@szl-holdings/mobile-ai";

const ACCENT = "#4d7c0f";
const DEFAULT_SYSTEM_CONTEXT = "You are Terra, a real estate intelligence AI assistant with access to property data, market analytics, and investment analysis tools.";
const DEFAULT_AGENT_ID = "terra";
const DEFAULT_AGENT_NAME = "Terra Intelligence";
const AUTH_TOKEN_KEY = "terra_auth_token";

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
