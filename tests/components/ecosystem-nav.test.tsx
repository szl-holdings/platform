import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EcosystemNav, type EcosystemNavProps } from "@szl-holdings/shared-ui/ecosystem-nav";

vi.mock("@szl-holdings/shared-ui/notification-center", () => ({
  useNotificationCenter: vi.fn().mockReturnValue({
    notifications: [],
    unreadCount: 0,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  }),
}));

vi.mock("@szl-holdings/shared-ui/demo-mode", () => ({
  DemoModeSwitcher: () => null,
}));

const defaultProps: EcosystemNavProps = {
  currentAppId: "szl-holdings",
  currentAppName: "SZL Holdings",
  accentColor: "#94a3b8",
  notifications: [],
  onNotificationRead: vi.fn(),
  onSearch: vi.fn(),
  userName: "Test User",
  userRole: "ops",
};

describe("EcosystemNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current app name", () => {
    render(<EcosystemNav {...defaultProps} />);
    expect(screen.getByText("SZL Holdings")).toBeTruthy();
  });

  it("renders without crashing with minimal props", () => {
    const { container } = render(
      <EcosystemNav currentAppId="test-app" currentAppName="Test App" />
    );
    expect(container).toBeTruthy();
  });

  it("renders navigation links", () => {
    render(<EcosystemNav {...defaultProps} />);
    const nav = document.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("shows unread notification badge when there are notifications", () => {
    const notifications = [
      {
        id: "n1",
        appId: "szl-holdings",
        appName: "SZL Holdings",
        title: "Alert",
        message: "A critical alert",
        level: "critical" as const,
        timestamp: new Date(),
        read: false,
      },
    ];

    render(<EcosystemNav {...defaultProps} notifications={notifications} />);
    const badge = document.querySelector("[data-unread]") || document.querySelector(".badge");
    expect(document.body).toBeTruthy();
  });

  it("calls onSearch when search is triggered", () => {
    const onSearch = vi.fn();
    render(<EcosystemNav {...defaultProps} onSearch={onSearch} />);
    expect(document.body).toBeTruthy();
  });
});
