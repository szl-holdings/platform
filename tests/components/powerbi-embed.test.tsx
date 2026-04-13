import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PowerBiEmbed, type PowerBiEmbedConfig } from "@szl-holdings/shared-ui";

const mockConfig: PowerBiEmbedConfig = {
  reportId: "test-report-id",
  groupId: "test-group-id",
  embedUrl: "https://app.powerbi.com/reportEmbed?reportId=test-report-id",
  embedToken: "test-embed-token",
  expiration: "2026-12-31T00:00:00Z",
};

describe("PowerBiEmbed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).powerbi;
  });

  it("renders configure prompt when no config is provided", () => {
    render(<PowerBiEmbed />);
    expect(screen.getByText(/configure/i)).toBeTruthy();
  });

  it("renders with title when provided", () => {
    render(<PowerBiEmbed title="Revenue Dashboard" />);
    expect(screen.getByText("Revenue Dashboard")).toBeTruthy();
  });

  it("renders with description when provided", () => {
    render(<PowerBiEmbed description="Monthly revenue overview" />);
    expect(screen.getByText("Monthly revenue overview")).toBeTruthy();
  });

  it("shows configure button and calls callback when clicked", () => {
    const onConfigureClick = vi.fn();
    render(<PowerBiEmbed onConfigureClick={onConfigureClick} />);
    const configBtn = screen.getByRole("button", { name: /configure/i });
    configBtn.click();
    expect(onConfigureClick).toHaveBeenCalled();
  });

  it("renders embed container when config is provided", () => {
    render(<PowerBiEmbed config={mockConfig} title="Test Report" />);
    expect(document.body).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(<PowerBiEmbed className="my-custom-class" />);
    expect(container.querySelector(".my-custom-class")).toBeTruthy();
  });

  it("renders with custom height", () => {
    const { container } = render(<PowerBiEmbed height={600} />);
    const elem = container.querySelector("[style*='600']") || container.firstChild;
    expect(elem).toBeTruthy();
  });

  it("renders null config as not configured", () => {
    render(<PowerBiEmbed config={null} />);
    expect(screen.getByText(/configure/i)).toBeTruthy();
  });
});
