import { type IRouter, Router } from 'express';
import { sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

router.get('/privacy/policy', (_req, res) => {
  const policy = {
    version: '1.2',
    effectiveDate: '2025-01-01',
    lastUpdated: '2025-04-01',
    controller: {
      name: 'SZL Holdings',
      email: 'privacy@szlholdings.com',
    },
    summary:
      'We collect and process personal data to deliver our platform services. We do not sell your data.',
    sections: [
      {
        title: 'Data We Collect',
        content:
          'We collect account information (name, email), authentication tokens, usage analytics, device identifiers for push notifications, and billing contact information. We do not store payment card data (handled exclusively by Stripe).',
      },
      {
        title: 'How We Use Your Data',
        content:
          'Your data is used to: authenticate you and maintain your session; deliver features across the SZL platform (Aegis, Terra, Vessels, PRISM, Lyte); send notifications you have opted into; improve our services through aggregated analytics; comply with legal obligations.',
      },
      {
        title: 'Legal Basis for Processing (GDPR)',
        content:
          'We process your data under the following legal bases: (a) Contract performance — account management, feature delivery; (b) Legitimate interest — security monitoring, fraud prevention, analytics; (c) Consent — push notifications, optional analytics cookies; (d) Legal obligation — audit logs, financial records.',
      },
      {
        title: 'Data Retention',
        content:
          'Sessions are retained for 30 days. Audit logs are retained for 36 months. Billing records are retained for 7 years as required by law. You may request deletion of personal data at any time using the right-to-erasure endpoint.',
      },
      {
        title: 'Your Rights (GDPR / CCPA)',
        content:
          'You have the right to: access your data (GET /api/gdpr/export); request erasure (POST /api/gdpr/erasure); correct inaccurate data (contact support); port your data; object to processing; withdraw consent for optional processing.',
      },
      {
        title: 'Third-Party Processors',
        content:
          'We use Replit for infrastructure hosting, Stripe for payment processing, and Expo for mobile push notifications. All processors operate under data processing agreements and applicable transfer mechanisms.',
      },
      {
        title: 'International Transfers',
        content:
          'Your data may be processed in the United States. Where required, we rely on Standard Contractual Clauses or equivalent mechanisms for cross-border transfers.',
      },
      {
        title: 'Cookies',
        content:
          'We use essential cookies for authentication and security (CSRF protection). Optional analytics cookies require your consent. You can manage cookie preferences at any time through the cookie consent banner.',
      },
      {
        title: 'Contact & Complaints',
        content:
          'For privacy inquiries, contact privacy@szlholdings.com. You have the right to lodge a complaint with your national data protection authority.',
      },
    ],
    gdprEndpoints: {
      export: 'GET /api/gdpr/export',
      erasure: 'POST /api/gdpr/erasure',
      dataProcessingRecords: 'GET /api/gdpr/data-processing-records',
    },
  };

  sendSuccess(res, policy);
});

router.get('/privacy/terms', (_req, res) => {
  const terms = {
    version: '1.1',
    effectiveDate: '2025-01-01',
    lastUpdated: '2025-04-01',
    summary: 'By using the SZL platform, you agree to use it lawfully and not to misuse it.',
    sections: [
      {
        title: 'Acceptance',
        content:
          'By accessing or using the SZL platform, you agree to these Terms of Service. If you do not agree, do not use the platform.',
      },
      {
        title: 'Permitted Use',
        content:
          'The platform is provided for lawful business use only. You must not use the platform to violate any laws, infringe intellectual property rights, or attempt to gain unauthorized access to systems.',
      },
      {
        title: 'Account Responsibilities',
        content:
          'You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorized access.',
      },
      {
        title: 'Service Availability',
        content:
          'We strive for high availability but do not guarantee uninterrupted service. We may perform maintenance that temporarily affects availability.',
      },
      {
        title: 'Data Ownership',
        content:
          'You retain ownership of data you submit to the platform. By submitting data, you grant us a limited license to process it solely to deliver the services.',
      },
      {
        title: 'Limitation of Liability',
        content:
          'To the extent permitted by law, SZL Holdings is not liable for indirect, incidental, or consequential damages arising from your use of the platform.',
      },
      {
        title: 'Governing Law',
        content:
          'These terms are governed by the laws of the jurisdiction in which SZL Holdings is incorporated.',
      },
      {
        title: 'Changes',
        content:
          'We may update these terms. We will notify you of material changes. Continued use after notice constitutes acceptance.',
      },
    ],
  };

  sendSuccess(res, terms);
});

export default router;
