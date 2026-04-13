import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommandPalette, type CommandItem } from "@szl-holdings/shared-ui/command-palette";

const mockCommands: CommandItem[] = [
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    description: "Navigate to the main dashboard",
    group: "Navigation",
    action: vi.fn(),
    keywords: ["home", "main"],
  },
  {
    id: "nav-reports",
    label: "View Reports",
    description: "See all reports",
    group: "Navigation",
    action: vi.fn(),
  },
  {
    id: "action-export",
    label: "Export Data",
    description: "Export current view as CSV",
    group: "Actions",
    action: vi.fn(),
  },
];

describe("CommandPalette", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <CommandPalette open={false} onClose={onClose} commands={mockCommands} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when open", () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("shows all commands when no query", () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    expect(screen.getByText("Go to Dashboard")).toBeTruthy();
    expect(screen.getByText("View Reports")).toBeTruthy();
    expect(screen.getByText("Export Data")).toBeTruthy();
  });

  it("filters commands by query text", async () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "export" } });

    await waitFor(() => {
      expect(screen.getByText("Export Data")).toBeTruthy();
    });

    expect(screen.queryByText("View Reports")).toBeNull();
  });

  it("filters commands by keyword", async () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "home" } });

    await waitFor(() => {
      expect(screen.getByText("Go to Dashboard")).toBeTruthy();
    });
  });

  it("shows no results message when search has no matches", async () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "zzznomatch" } });

    await waitFor(() => {
      expect(screen.queryByText("Go to Dashboard")).toBeNull();
      expect(screen.queryByText("View Reports")).toBeNull();
    });
  });

  it("calls onClose when Escape is pressed", () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls command action on click", async () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);

    const dashboardItem = screen.getByText("Go to Dashboard");
    fireEvent.click(dashboardItem);

    expect(mockCommands[0].action).toHaveBeenCalled();
  });

  it("groups commands by group label", () => {
    render(<CommandPalette open={true} onClose={onClose} commands={mockCommands} />);
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
  });

  it("shows custom appName in header when provided", () => {
    render(
      <CommandPalette
        open={true}
        onClose={onClose}
        commands={mockCommands}
        appName="SZL Holdings"
      />
    );
    expect(screen.getByText(/SZL Holdings/i)).toBeTruthy();
  });

  it("shows custom placeholder when provided", () => {
    render(
      <CommandPalette
        open={true}
        onClose={onClose}
        commands={mockCommands}
        placeholder="Search commands..."
      />
    );
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("placeholder")).toBe("Search commands...");
  });
});
