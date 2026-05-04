import type { DestinationConnector, ConnectionCheckResult, ObjectDescriptor, FieldDescriptor, WriteBatchResult } from '../connector-protocol';

const STUB_METADATA: Record<string, { objects: ObjectDescriptor[]; fields: Record<string, FieldDescriptor[]> }> = {
  salesforce: {
    objects: [
      { name: 'Contact', label: 'Contact', description: 'A person in Salesforce' },
      { name: 'Lead', label: 'Lead', description: 'A potential customer' },
      { name: 'Account', label: 'Account', description: 'An organization' },
      { name: 'Opportunity', label: 'Opportunity', description: 'A sales opportunity' },
      { name: 'CustomObject__c', label: 'Custom Object', description: 'Your custom Salesforce object' },
    ],
    fields: {
      Contact: [
        { name: 'FirstName', label: 'First Name', type: 'string', required: false, updateable: true },
        { name: 'LastName', label: 'Last Name', type: 'string', required: true, updateable: true },
        { name: 'Email', label: 'Email', type: 'email', required: false, updateable: true },
        { name: 'Phone', label: 'Phone', type: 'phone', required: false, updateable: true },
        { name: 'Title', label: 'Title', type: 'string', required: false, updateable: true },
      ],
      Lead: [
        { name: 'FirstName', label: 'First Name', type: 'string', required: false, updateable: true },
        { name: 'LastName', label: 'Last Name', type: 'string', required: true, updateable: true },
        { name: 'Email', label: 'Email', type: 'email', required: false, updateable: true },
        { name: 'Company', label: 'Company', type: 'string', required: true, updateable: true },
        { name: 'Status', label: 'Lead Status', type: 'picklist', required: true, updateable: true },
      ],
      Account: [
        { name: 'Name', label: 'Account Name', type: 'string', required: true, updateable: true },
        { name: 'Industry', label: 'Industry', type: 'picklist', required: false, updateable: true },
        { name: 'Website', label: 'Website', type: 'url', required: false, updateable: true },
        { name: 'Phone', label: 'Phone', type: 'phone', required: false, updateable: true },
      ],
      Opportunity: [
        { name: 'Name', label: 'Name', type: 'string', required: true, updateable: true },
        { name: 'StageName', label: 'Stage', type: 'picklist', required: true, updateable: true },
        { name: 'Amount', label: 'Amount', type: 'currency', required: false, updateable: true },
        { name: 'CloseDate', label: 'Close Date', type: 'date', required: true, updateable: true },
        { name: 'Description', label: 'Description', type: 'textarea', required: false, updateable: true },
      ],
    },
  },
  hubspot: {
    objects: [
      { name: 'contacts', label: 'Contact', description: 'HubSpot contact record' },
      { name: 'companies', label: 'Company', description: 'HubSpot company record' },
      { name: 'deals', label: 'Deal', description: 'HubSpot deal record' },
      { name: 'tickets', label: 'Ticket', description: 'HubSpot support ticket' },
    ],
    fields: {
      contacts: [
        { name: 'email', label: 'Email', type: 'string', required: true, updateable: true },
        { name: 'firstname', label: 'First Name', type: 'string', required: false, updateable: true },
        { name: 'lastname', label: 'Last Name', type: 'string', required: false, updateable: true },
        { name: 'phone', label: 'Phone', type: 'string', required: false, updateable: true },
        { name: 'company', label: 'Company', type: 'string', required: false, updateable: true },
      ],
      deals: [
        { name: 'dealname', label: 'Deal Name', type: 'string', required: true, updateable: true },
        { name: 'amount', label: 'Amount', type: 'number', required: false, updateable: true },
        { name: 'dealstage', label: 'Deal Stage', type: 'picklist', required: false, updateable: true },
        { name: 'industry', label: 'Industry', type: 'string', required: false, updateable: true },
      ],
    },
  },
  google_sheets: {
    objects: [{ name: 'spreadsheet_row', label: 'Spreadsheet Row', description: 'Append or upsert a row in a Google Sheet' }],
    fields: { spreadsheet_row: [{ name: 'values', label: 'Row Values', type: 'json', required: true, updateable: true }] },
  },
  notion: {
    objects: [{ name: 'database_row', label: 'Database Row', description: 'Add or update a Notion database row' }],
    fields: { database_row: [{ name: 'properties', label: 'Properties', type: 'json', required: true, updateable: true }] },
  },
  airtable: {
    objects: [{ name: 'record', label: 'Record', description: 'Airtable base record' }],
    fields: { record: [{ name: 'fields', label: 'Fields', type: 'json', required: true, updateable: true }] },
  },
  zendesk: {
    objects: [{ name: 'ticket', label: 'Ticket', description: 'Zendesk support ticket' }],
    fields: { ticket: [
      { name: 'subject', label: 'Subject', type: 'string', required: true, updateable: true },
      { name: 'description', label: 'Description', type: 'string', required: false, updateable: true },
      { name: 'priority', label: 'Priority', type: 'picklist', required: false, updateable: true },
    ] },
  },
  marketo: {
    objects: [{ name: 'lead', label: 'Lead', description: 'Marketo lead record' }],
    fields: { lead: [
      { name: 'email', label: 'Email', type: 'string', required: true, updateable: true },
      { name: 'firstName', label: 'First Name', type: 'string', required: false, updateable: true },
      { name: 'lastName', label: 'Last Name', type: 'string', required: false, updateable: true },
    ] },
  },
  intercom: {
    objects: [{ name: 'contact', label: 'Contact', description: 'Intercom contact/user' }],
    fields: { contact: [
      { name: 'email', label: 'Email', type: 'string', required: true, updateable: true },
      { name: 'name', label: 'Name', type: 'string', required: false, updateable: true },
    ] },
  },
  pipedrive: {
    objects: [{ name: 'deal', label: 'Deal', description: 'Pipedrive deal' }],
    fields: { deal: [
      { name: 'title', label: 'Title', type: 'string', required: true, updateable: true },
      { name: 'value', label: 'Value', type: 'number', required: false, updateable: true },
    ] },
  },
  mailchimp: {
    objects: [{ name: 'member', label: 'List Member', description: 'Mailchimp list subscriber' }],
    fields: { member: [
      { name: 'email_address', label: 'Email', type: 'string', required: true, updateable: true },
      { name: 'status', label: 'Status', type: 'picklist', required: true, updateable: true },
    ] },
  },
  segment: {
    objects: [{ name: 'identify', label: 'Identify', description: 'Segment identify call' }, { name: 'track', label: 'Track', description: 'Segment track event' }],
    fields: {
      identify: [
        { name: 'userId', label: 'User ID', type: 'string', required: true, updateable: true },
        { name: 'traits', label: 'Traits', type: 'json', required: false, updateable: true },
      ],
      track: [
        { name: 'userId', label: 'User ID', type: 'string', required: true, updateable: true },
        { name: 'event', label: 'Event', type: 'string', required: true, updateable: true },
        { name: 'properties', label: 'Properties', type: 'json', required: false, updateable: true },
      ],
    },
  },
};

export function createStubDestination(destinationType: string): DestinationConnector {
  const meta = STUB_METADATA[destinationType];

  return {
    type: destinationType,

    async checkConnection(_credentials: Record<string, unknown>): Promise<ConnectionCheckResult> {
      return {
        success: false,
        message: `${destinationType} connector requires OAuth configuration. Please configure credentials in the platform settings.`,
        latencyMs: 0,
      };
    },

    async discover(_credentials: Record<string, unknown>): Promise<{ objects: ObjectDescriptor[]; fields: Record<string, FieldDescriptor[]> }> {
      if (meta) return meta;
      return {
        objects: [{ name: 'record', label: 'Record', description: `${destinationType} record` }],
        fields: { record: [] },
      };
    },

    async writeBatch(_credentials: Record<string, unknown>, _objectType: string, records: Array<Record<string, unknown>>): Promise<WriteBatchResult> {
      return {
        rowResults: records.map((_, i) => ({
          rowIndex: i,
          success: false,
          errorMessage: `${destinationType} connector is not yet configured. Complete OAuth setup to enable syncing.`,
        })),
        successCount: 0,
        failureCount: records.length,
      };
    },
  };
}

export const STUB_DESTINATIONS = [
  'salesforce', 'hubspot', 'google_sheets', 'notion', 'airtable',
  'zendesk', 'marketo', 'intercom', 'pipedrive', 'mailchimp', 'segment',
];
