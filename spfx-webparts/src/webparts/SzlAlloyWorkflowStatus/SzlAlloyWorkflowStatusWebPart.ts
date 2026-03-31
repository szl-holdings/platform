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
import AlloyWorkflowStatus from "./components/AlloyWorkflowStatus";

export interface ISzlAlloyWorkflowStatusWebPartProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  showPendingApprovals: boolean;
  maxWorkflows: number;
  statusFilter: string;
}

export default class SzlAlloyWorkflowStatusWebPart extends BaseClientSideWebPart<ISzlAlloyWorkflowStatusWebPartProps> {
  private _aadClient: AadHttpClient | undefined;

  protected async onInit(): Promise<void> {
    await super.onInit();
    if (this.properties.apiBaseUrl) {
      this._aadClient = await this.context.aadHttpClientFactory.getClient(this.properties.apiBaseUrl);
    }
  }

  public render(): void {
    const element = React.createElement(AlloyWorkflowStatus, {
      apiBaseUrl: this.properties.apiBaseUrl,
      orgId: this.properties.orgId,
      refreshIntervalSeconds: this.properties.refreshIntervalSeconds || 30,
      showPendingApprovals: this.properties.showPendingApprovals,
      maxWorkflows: this.properties.maxWorkflows || 5,
      statusFilter: this.properties.statusFilter || "all",
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
          header: { description: "Configure the Alloy Workflow Status web part" },
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
                  min: 15,
                  max: 300,
                  step: 15,
                  showValue: true,
                }),
                PropertyPaneSlider("maxWorkflows", {
                  label: "Max Workflows to Display",
                  min: 1,
                  max: 20,
                  step: 1,
                  showValue: true,
                }),
                PropertyPaneDropdown("statusFilter", {
                  label: "Status Filter",
                  options: [
                    { key: "all", text: "All States" },
                    { key: "running", text: "Running" },
                    { key: "queued", text: "Queued" },
                    { key: "waiting_approval", text: "Waiting Approval" },
                    { key: "completed", text: "Completed" },
                    { key: "failed", text: "Failed" },
                  ],
                }),
                PropertyPaneToggle("showPendingApprovals", {
                  label: "Show Pending Approvals Banner",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
