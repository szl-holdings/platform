import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneSlider,
  PropertyPaneDropdown,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { AadHttpClient, type HttpClientResponse } from "@microsoft/sp-http";
import * as React from "react";
import * as ReactDom from "react-dom";
import LyteSignalSummary from "./components/LyteSignalSummary";
import type { ILyteSignalSummaryProps } from "./components/ILyteSignalSummaryProps";

export interface ISzlLyteSignalSummaryWebPartProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  showCriticalOnly: boolean;
  maxSignals: number;
  theme: string;
}

export default class SzlLyteSignalSummaryWebPart extends BaseClientSideWebPart<ISzlLyteSignalSummaryWebPartProps> {
  private _aadClient: AadHttpClient | undefined;

  protected async onInit(): Promise<void> {
    await super.onInit();
    if (this.properties.apiBaseUrl) {
      this._aadClient = await this.context.aadHttpClientFactory.getClient(
        this.properties.apiBaseUrl,
      );
    }
  }

  public render(): void {
    const element: React.ReactElement<ILyteSignalSummaryProps> =
      React.createElement(LyteSignalSummary, {
        apiBaseUrl: this.properties.apiBaseUrl,
        orgId: this.properties.orgId,
        refreshIntervalSeconds: this.properties.refreshIntervalSeconds || 60,
        showCriticalOnly: this.properties.showCriticalOnly,
        maxSignals: this.properties.maxSignals || 10,
        theme: this.properties.theme || "dark",
        aadClient: this._aadClient,
        userDisplayName: this.context.pageContext.user.displayName,
      });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: "Configure the Lyte Signal Summary web part" },
          groups: [
            {
              groupName: "Connection",
              groupFields: [
                PropertyPaneTextField("apiBaseUrl", {
                  label: "SZL API Base URL",
                  placeholder: "https://your-szl-instance.com/api",
                  description: "The base URL of the SZL API server (without trailing slash)",
                }),
                PropertyPaneTextField("orgId", {
                  label: "Organization ID",
                  placeholder: "Leave blank to show all orgs",
                  description: "Filter signals by organization ID",
                }),
              ],
            },
            {
              groupName: "Display",
              groupFields: [
                PropertyPaneSlider("refreshIntervalSeconds", {
                  label: "Refresh Interval (seconds)",
                  min: 15,
                  max: 300,
                  step: 15,
                  showValue: true,
                }),
                PropertyPaneSlider("maxSignals", {
                  label: "Max Signals to Display",
                  min: 1,
                  max: 50,
                  step: 1,
                  showValue: true,
                }),
                PropertyPaneToggle("showCriticalOnly", {
                  label: "Show Critical Signals Only",
                }),
                PropertyPaneDropdown("theme", {
                  label: "Theme",
                  options: [
                    { key: "dark", text: "Dark" },
                    { key: "light", text: "Light" },
                    { key: "system", text: "System Default" },
                  ],
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
