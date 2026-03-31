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
import VesselsFleetStatus from "./components/VesselsFleetStatus";

export interface ISzlVesselsFleetStatusWebPartProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  showMap: boolean;
  vesselFilter: string;
  maxVessels: number;
}

export default class SzlVesselsFleetStatusWebPart extends BaseClientSideWebPart<ISzlVesselsFleetStatusWebPartProps> {
  private _aadClient: AadHttpClient | undefined;

  protected async onInit(): Promise<void> {
    await super.onInit();
    if (this.properties.apiBaseUrl) {
      this._aadClient = await this.context.aadHttpClientFactory.getClient(this.properties.apiBaseUrl);
    }
  }

  public render(): void {
    const element = React.createElement(VesselsFleetStatus, {
      apiBaseUrl: this.properties.apiBaseUrl,
      orgId: this.properties.orgId,
      refreshIntervalSeconds: this.properties.refreshIntervalSeconds || 120,
      showMap: this.properties.showMap,
      vesselFilter: this.properties.vesselFilter || "all",
      maxVessels: this.properties.maxVessels || 20,
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
          header: { description: "Configure the Vessels Fleet Status web part" },
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
                  min: 30,
                  max: 600,
                  step: 30,
                  showValue: true,
                }),
                PropertyPaneSlider("maxVessels", {
                  label: "Max Vessels to Display",
                  min: 1,
                  max: 100,
                  step: 1,
                  showValue: true,
                }),
                PropertyPaneToggle("showMap", {
                  label: "Show Fleet Map",
                }),
                PropertyPaneDropdown("vesselFilter", {
                  label: "Vessel Filter",
                  options: [
                    { key: "all", text: "All Vessels" },
                    { key: "active", text: "Active Only" },
                    { key: "port", text: "In Port" },
                    { key: "transit", text: "In Transit" },
                    { key: "alert", text: "Alert Status" },
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
