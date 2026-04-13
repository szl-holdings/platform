import {
  CodeBlock, SectionHeader, SubSectionHeader, InlineCode,
  ERROR_CODES, API_ERROR_CODES,
} from "./shared";

export function ErrorCodesSection() {
  return (
    <section>
      <SectionHeader
        id="errors"
        title="Error Codes"
        subtitle="All errors follow a consistent structure with an HTTP status code, human-readable message, and machine-readable code field."
      />

      <CodeBlock
        filename="Error response shape"
        language="json"
        code={`{
  "error": "Not Found",
  "message": "The requested resource does not exist.",
  "code": "RESOURCE_NOT_FOUND",
  "statusCode": 404,
  "correlationId": "req_01j9xkz..."
}`}
      />

      <SubSectionHeader id="error-http" title="HTTP Status Codes" />
      <div
        className="rounded-lg overflow-hidden mb-8"
        style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
              {["Code", "Name", "Description"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3"
                  style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ERROR_CODES.map(({ code, name, description }, i) => (
              <tr
                key={code}
                style={{
                  borderBottom: i < ERROR_CODES.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                  background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                }}
              >
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: code >= 500
                        ? "hsl(0,72%,62%)"
                        : code >= 400
                        ? "hsl(38,88%,60%)"
                        : "hsl(214,8%,62%)",
                      background: code >= 500
                        ? "hsla(0,72%,52%,0.12)"
                        : code >= 400
                        ? "hsla(38,88%,50%,0.12)"
                        : "hsla(214,14%,12%,0.5)",
                    }}
                  >
                    {code}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "hsl(214,10%,78%)", fontSize: "0.8125rem" }}>
                  {name}
                </td>
                <td className="px-4 py-3" style={{ color: "hsl(214,8%,60%)" }}>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubSectionHeader id="error-codes-api" title="Application Error Codes" />
      <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
        The <InlineCode>code</InlineCode> field in error responses provides machine-readable context
        for programmatic error handling.
      </p>
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
              {["Code", "HTTP", "Description"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3"
                  style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {API_ERROR_CODES.map(({ code, http, description }, i) => (
              <tr
                key={code}
                style={{
                  borderBottom: i < API_ERROR_CODES.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                  background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                }}
              >
                <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(200,80%,72%)", whiteSpace: "nowrap" }}>
                  {code}
                </td>
                <td className="px-4 py-3">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: http >= 500 ? "hsl(0,72%,62%)" : "hsl(38,88%,60%)",
                    }}
                  >
                    {http}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "hsl(214,8%,60%)" }}>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
