import React from "react";
import { AICopilotModal } from "@szl-holdings/mobile-ai";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

const ACCENT = "#8b5cf6";
const DEFAULT_SYSTEM_CONTEXT = "You are Alloy, an AI intelligence assistant with access to agents, workflows, analytics, and decision systems. Help users monitor operations, manage approvals, and extract insights.";
const DEFAULT_AGENT_ID = "alloy";
const DEFAULT_AGENT_NAME = "Alloy Intelligence";

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
