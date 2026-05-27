process.on("uncaughtException", e=>{console.error("UNCAUGHT",(e as Error).stack);process.exit(2)});
process.on("unhandledRejection", e=>{console.error("UNHANDLED",e);process.exit(3)});
(async()=>{
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  console.log("env:", !!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY, !!process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL);
  const c = new Anthropic({apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY, baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL});
  const t0=Date.now();
  const m = await c.messages.create({model:"claude-sonnet-4-6", max_tokens:64, temperature:0.2, messages:[{role:"user",content:"reply exactly: PING_OK"}]});
  console.log("ms:", Date.now()-t0, "blocks:", m.content.length, "text:", (m.content[0] as any).text, "in:", m.usage.input_tokens, "out:", m.usage.output_tokens);
})();
