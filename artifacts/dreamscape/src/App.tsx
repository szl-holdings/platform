import { useEffect } from "react";

function App() {
  useEffect(() => {
    window.location.replace("/alloy/creative");
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080614", color: "#94a3b8", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
      Redirecting to Alloy Creative Workflows&hellip;
    </div>
  );
}

export default App;
