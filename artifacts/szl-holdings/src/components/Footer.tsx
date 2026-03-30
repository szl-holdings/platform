const portfolioLinks = [
  { label: "Alloy", href: "/alloy/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
  { label: "INCA", href: "/inca/" },
  { label: "Firestorm", href: "/firestorm/" },
];

const companyLinks = [
  { label: "Ecosystem", href: "#portfolio" },
  { label: "Our Thesis", href: "#thesis" },
  { label: "Timeline", href: "#milestones" },
  { label: "Contact", href: "#contact" },
];

const founderLinks = [
  { label: "Stephen Lutar", href: "/stephen/" },
  { label: "Insights", href: "/insights" },
];

export function Footer() {
  return (
    <footer style={{
      background: "hsl(210,12%,5%)",
      borderTop: "1px solid hsla(0,0%,100%,0.05)",
      paddingTop: "clamp(3rem,6vw,5rem)",
      paddingBottom: "clamp(2rem,4vw,3rem)",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, hsl(210,12%,24%), hsl(210,10%,18%))",
                border: "1px solid hsla(0,0%,100%,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ color: "hsl(38,12%,94%)", fontWeight: "700", fontSize: "11px", fontFamily: "system-ui" }}>S</span>
              </div>
              <span style={{ fontWeight: "600", fontSize: "14px", color: "hsl(38,12%,94%)", letterSpacing: "-0.01em" }}>SZL Holdings</span>
            </div>
            <p style={{
              fontSize: "13.5px",
              color: "hsl(210,5%,52%)",
              lineHeight: "1.65",
              maxWidth: "22rem",
              marginBottom: "0.75rem",
            }}>
              Strategic technology portfolio. Building at the intersection of maritime intelligence, AI, advisory, and enterprise operations.
            </p>
            <p style={{ fontSize: "12px", color: "hsl(210,5%,40%)" }}>Washington, D.C. · London · Singapore</p>
          </div>

          <div>
            <h4 style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "hsl(210,5%,36%)",
              marginBottom: "1.125rem",
            }}>Portfolio</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {portfolioLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={{
                      fontSize: "13.5px",
                      color: "hsl(210,5%,50%)",
                      textDecoration: "none",
                      transition: "color 0.18s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,50%)"}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "hsl(210,5%,36%)",
              marginBottom: "1.125rem",
            }}>Company</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    style={{
                      fontSize: "13.5px",
                      color: "hsl(210,5%,50%)",
                      textDecoration: "none",
                      transition: "color 0.18s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,50%)"}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            {founderLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  display: "block",
                  fontSize: "13.5px",
                  color: "hsl(210,5%,50%)",
                  textDecoration: "none",
                  transition: "color 0.18s ease",
                  marginBottom: "0.625rem",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,50%)"}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid hsla(0,0%,100%,0.05)",
          alignItems: "flex-start",
        }} className="sm:flex-row sm:justify-between sm:items-center">
          <p style={{ fontSize: "12px", color: "hsl(210,5%,34%)" }}>
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
          <p style={{ fontSize: "12px", color: "hsl(210,5%,34%)" }}>inquiries@szlholdings.com</p>
        </div>
      </div>
    </footer>
  );
}
