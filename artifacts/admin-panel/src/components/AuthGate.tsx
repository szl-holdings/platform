import { ReactNode } from "react";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  return <>{children}</>;
}
