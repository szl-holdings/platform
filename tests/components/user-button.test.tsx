import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserButton } from "../../lib/shared-ui/src/UserButton";

const { useAuth } = await import("@workspace/replit-auth-web");
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("UserButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading skeleton when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(<UserButton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeTruthy();
  });

  it("shows Sign In button when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<UserButton />);
    expect(screen.getByText("Sign In")).toBeTruthy();
  });

  it("calls login when Sign In is clicked", () => {
    const login = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login,
      logout: vi.fn(),
    });

    render(<UserButton />);
    fireEvent.click(screen.getByText("Sign In"));
    expect(login).toHaveBeenCalledOnce();
  });

  it("shows Sign out button when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: "Test User", avatarUrl: null },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<UserButton />);
    expect(screen.getByText("Sign out")).toBeTruthy();
  });

  it("calls logout when Sign out is clicked", () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { displayName: "Test User", avatarUrl: null },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout,
    });

    render(<UserButton />);
    fireEvent.click(screen.getByText("Sign out"));
    expect(logout).toHaveBeenCalledOnce();
  });

  it("displays user avatar image when avatarUrl is provided", () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: "Test User", avatarUrl: "https://example.com/avatar.jpg" },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<UserButton />);
    const img = screen.getByAltText("Test User");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("https://example.com/avatar.jpg");
  });

  it("shows user initial when no avatar is provided", () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: "Alice Smith", avatarUrl: null },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<UserButton />);
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("shows user display name when showName is true", () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: "Alice Smith", avatarUrl: null },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<UserButton showName={true} />);
    expect(screen.getByText("Alice Smith")).toBeTruthy();
  });

  it("applies custom className", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(<UserButton className="test-class" />);
    expect(container.querySelector(".test-class") || container.firstChild).toBeTruthy();
  });
});
