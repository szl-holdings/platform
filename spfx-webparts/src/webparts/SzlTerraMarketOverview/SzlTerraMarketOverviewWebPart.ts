import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneSlider,
  PropertyPaneDropdown,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { AadHttpClient } from "@microsoft/sp-http";
import * as React from "react";
import * as ReactDom from "react-dom";
import TerraMarketOverview from "./components/TerraMarketOverview";

export interface ISzlTerraMarketOverviewWebPartProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  marketFilter: string;
  showHeatmap: boolean;
  currency: string;
}

export default class SzlTerraMarketOverviewWebPart extends BaseClientSideWebPart<ISzlTerraMarketOverviewWebPartProps> {
  private _aadClient: AadHttpClient | undefined;

  protected async onInit(): Promise<void> {
    await super.onInit();
    if (this.properties.apiBaseUrl) {
      this._aadClient = await this.context.aadHttpClientFactory.getClient(this.properties.apiBaseUrl);
    }
  }

  public render(): void {
    const element = React.createElement(TerraMarketOverview, {
      apiBaseUrl: this.properties.apiBaseUrl,
      orgId: this.properties.orgId,
      refreshIntervalSeconds: this.properties.refreshIntervalSeconds || 300,
      marketFilter: this.properties.marketFilter || "all",
      showHeatmap: this.properties.showHeatmap,
      currency: this.properties.currency || "USD",
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
          header: { description: "Configure the Terra Market Overview web part" },
          groups: [
            {
              groupName: "Connection",
              groupFields: [
                PropertyPaneTextField("apiBaseUrl", {
                  label: "SZL API Base URL",
                  placeholder: "https://your-szl-instance.com/api",
                }),
                PropertyPaneTextField("orgId", {
                  label: "Organization ID",
                  placeholder: "Leave blank for all orgs",
                }),
              ],
            },
            {
              groupName: "Display",
              groupFields: [
                PropertyPaneSlider("refreshIntervalSeconds", {
                  label: "Refresh Interval (seconds)",
                  min: 60,
                  max: 3600,
                  step: 60,
                  showValue: true,
                }),
                PropertyPaneDropdown("marketFilter", {
                  label: "Market Filter",
                  options: [
                    { key: "all", text: "All Markets" },
                    { key: "residential", text: "Residential" },
                    { key: "commercial", text: "Commercial" },
                    { key: "industrial", text: "Industrial" },
                    { key: "mixed_use", text: "Mixed Use" },
                  ],
                }),
                PropertyPaneDropdown("currency", {
                  label: "Currency",
                  options: [
                    { key: "USD", text: "US Dollar (USD)" },
                    { key: "EUR", text: "Euro (EUR)" },
                    { key: "GBP", text: "British Pound (GBP)" },
                    { key: "CAD", text: "Canadian Dollar (CAD)" },
                  ],
                }),
                PropertyPaneToggle("showHeatmap", {
                  label: "Show Market Heatmap",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
