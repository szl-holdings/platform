import { ServiceAdapter } from '../base.js';

export interface SMSResult {
  sent: boolean;
  to: string;
  messageId?: string;
  mock: boolean;
}

export interface VoiceCallResult {
  initiated: boolean;
  to: string;
  callSid?: string;
  mock: boolean;
}

export class TwilioAdapter extends ServiceAdapter {
  readonly name = 'twilio';
  readonly description = 'SMS messaging and voice calls via Twilio';
  readonly requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];

  private get accountSid(): string | undefined {
    return process.env.TWILIO_ACCOUNT_SID;
  }

  private get authToken(): string | undefined {
    return process.env.TWILIO_AUTH_TOKEN;
  }

  private get fromNumber(): string | undefined {
    return process.env.TWILIO_PHONE_NUMBER;
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;
  }

  protected override async performHealthCheck(): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
      },
    });
    if (!response.ok) throw new Error(`Twilio API returned ${response.status}`);
  }

  async sendSMS(to: string, body: string): Promise<SMSResult> {
    if (!this.isLive) {
      return {
        sent: true,
        to,
        messageId: `mock_msg_${Date.now()}`,
        mock: true,
      };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: to,
      From: this.fromNumber!,
      Body: body,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.authHeader,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const data = (await response.json()) as { sid: string };
    return {
      sent: true,
      to,
      messageId: data.sid,
      mock: false,
    };
  }

  async makeVoiceCall(to: string, ttsMessage: string): Promise<VoiceCallResult> {
    if (!this.isLive) {
      return {
        initiated: true,
        to,
        callSid: `mock_call_${Date.now()}`,
        mock: true,
      };
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${escapeXml(ttsMessage)}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">${escapeXml(ttsMessage)}</Say>
</Response>`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json`;
    const params = new URLSearchParams({
      To: to,
      From: this.fromNumber!,
      Twiml: twiml,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.authHeader,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Twilio Voice API error: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as { sid: string };
    return {
      initiated: true,
      to,
      callSid: data.sid,
      mock: false,
    };
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
