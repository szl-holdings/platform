import { ServiceAdapter } from "../base.js";

export interface SMSResult {
  sent: boolean;
  to: string;
  messageId?: string;
  mock: boolean;
}

export class TwilioAdapter extends ServiceAdapter {
  readonly name = "twilio";
  readonly description = "SMS messaging via Twilio";
  readonly requiredEnvVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
  ];

  private get accountSid(): string | undefined {
    return process.env["TWILIO_ACCOUNT_SID"];
  }

  private get authToken(): string | undefined {
    return process.env["TWILIO_AUTH_TOKEN"];
  }

  private get fromNumber(): string | undefined {
    return process.env["TWILIO_PHONE_NUMBER"];
  }

  protected async performHealthCheck(): Promise<void> {
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
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
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
}
