import React from "react";
import { router } from "expo-router";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

export default function WorkspaceSwitcherModal() {
  return <WorkspaceSwitcher onClose={() => router.back()} />;
}
