import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dokumentasi REST API — TugasKu',
  description: 'Dokumentasi Interaktif REST API Sistem Manajemen Akademik SMAN 1 Margaasih',
};

export default function ApiDocsPage() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          margin: 0;
          padding: 0;
          background: #0f172a;
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .top-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-bottom: 1px solid #334155;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .top-banner h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .top-banner p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #94a3b8;
        }
        .badge {
          background: #0284c7;
          color: #fff;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }
        .swagger-ui {
          padding: 20px 32px 60px;
        }
        .swagger-ui .info {
          margin: 24px 0;
        }
        .swagger-ui .info .title {
          color: #f8fafc !important;
        }
        .swagger-ui .info p, .swagger-ui .info li {
          color: #cbd5e1 !important;
        }
        .swagger-ui .scheme-container {
          background: #1e293b !important;
          box-shadow: none !important;
          border: 1px solid #334155 !important;
          border-radius: 8px;
          padding: 16px !important;
          margin-bottom: 24px;
        }
        .swagger-ui .opblock {
          border-radius: 8px !important;
          margin-bottom: 14px !important;
        }
        .swagger-ui .opblock .opblock-summary-operation-id,
        .swagger-ui .opblock .opblock-summary-path,
        .swagger-ui .opblock .opblock-summary-description {
          color: #f1f5f9 !important;
        }
        .swagger-ui input[type=text], .swagger-ui textarea {
          background: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid #475569 !important;
        }
        .swagger-ui select {
          background: #1e293b !important;
          color: #f8fafc !important;
        }
      `}} />

      <div className="top-banner">
        <div>
          <h1>
            <span>⚡</span> TugasKu REST API Interactive Docs
          </h1>
          <p>SMAN 1 Margaasih — 3-Layer Security (API Key, JWT Bearer, RBAC)</p>
        </div>
        <div>
          <span className="badge">v2.0.0 Stable</span>
        </div>
      </div>

      <div id="swagger-ui" />

      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossOrigin="anonymous"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        window.onload = function() {
          window.ui = SwaggerUIBundle({
            url: '/api/v1/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
            ],
            layout: "BaseLayout"
          });
        };
      `}} />
    </>
  );
}
