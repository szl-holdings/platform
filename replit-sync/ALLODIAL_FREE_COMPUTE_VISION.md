# Allodial Free Compute — the SZL way (free brains, free energy, no landlord)
2026-06-13. "China has the answers, the energy should be free, allodial and easy." This is the
honest, outside-the-box plan: free open-weight brains + free/owned energy + no kill-switch.
Doctrine v11/v12, open-weight only, never overclaim which tier served.

## The key distinction (this is the whole idea)
- FREE-AS-IN-FAUCET = someone else's free tier. Abundant, but they can shut it off (not allodial).
- FREE-AS-IN-ALLODIAL = you OWN it outright. The open WEIGHTS (yours forever once downloaded) +
  your OWN energy (sun) + your OWN hardware = no landlord, no kill-switch. THIS is sovereignty.
SZL uses BOTH: faucet tiers as free abundant fallback; allodial as the unkillable floor.

## CHINA: the answers are open-weight + nearly-free (verified)
Four Chinese labs shipped open-weight coding models in a 12-day window — GLM-5.1, MiniMax M2.7,
Kimi K2.6, DeepSeek V4 Pro — at the agentic-engineering ceiling, cheap/free to run.
[bighatgroup china-ai-weekly; agentbearcorps price war]
- DeepSeek made a 75% cut PERMANENT (global price floor). [agentbearcorps]
- Qwen3-Max leads Arena-Hard at 90.5. [agentbearcorps]
- GLM-4.7-Flash / GLM-4.5-Flash: PERMANENTLY FREE via API (open.bigmodel.cn). [vantaige; 163.com]
- All have OPEN WEIGHTS on HuggingFace/Ollama (glm-4.6, qwen2.5-coder, deepseek) — download once,
  own forever, run on your own metal. MIT/Apache licensed = redistributable. [vantaige]

## FREE inference endpoints SZL can wire TODAY (OpenAI-compatible, no/low friction)
All drop-in via base_url + key, mix into the LiteLLM failover fabric as FREE tiers:
- Zhipu GLM-Flash: PERMANENTLY FREE, base https://open.bigmodel.cn/api/paas/v4 [163.com; vantaige]
- SiliconFlow: 3 models FREE (Qwen3-8B, DeepSeek-R1-Distill-7B, DeepSeek-OCR), 1000 RPM,
  https://api.siliconflow.cn/v1 [therouter.ai]
- ModelScope: 2000 free calls/day (DeepSeek-R1 too). [163.com]
- Groq: free tier, LPU ultra-fast, https://api.groq.com/openai/v1 [awesome-free-llm-apis]
- GitHub Models: GPT-4.1/4o free 15RPM/150RPD, just a GitHub account, NO card. [163.com]
- Cloudflare Workers AI: 10,000 free Neurons/day, global edge. [163.com]
- OVH Kepler: ANONYMOUS free tier, NO key/signup, 40+ EU open-weight models. [awesome-free-llm-apis]
- NVIDIA NIM: free w/ Dev Program, 100+ models. OpenRouter: ~28 :free models. [awesome-free-llm-apis]
- Free GPU NOTEBOOKS for self-run: Kaggle 30 GPU-hrs/week, Colab T4, Modal $30/mo, HF Spaces.

## ALLODIAL layer — the part no one dreams of (free energy + own metal + no kill-switch)
1) OWN THE WEIGHTS: mirror glm-4.6 / qwen2.5-coder:32b / deepseek to YOUR HF org + a cold local
   copy. Once downloaded, no provider can revoke them. The brain is yours forever.
2) FREE ENERGY: solar-powered always-on node. A low-watt sovereign anchor:
   - Mac mini M4 (~50W, best perf/watt for LLM) or Jetson/efficient mini-PC on a 12.8V LiFePO4
     battery + solar panel + charge controller. [reddit off-grid LLM; rentersoffgrid; botmonster]
   - Renters: portable solar power station (plug-in, no drilling) runs a 300-800W GPU box 4-24h.
   - The sun pays the electric bill -> inference marginal energy cost -> ~$0. Allodial.
3) NO LANDLORD MESH: BOINC/Petals/Parallax-style — pool idle/volunteer GPUs into a swarm that
   serves big models with the SAME correctness as local; peers can drop and it reroutes. Petals
   runs Llama-70B/BLOOM-176B over volunteer Internet; Parallax adds principled scheduling for
   1.58-3.6x throughput. Self-financing, self-maintaining, no central owner.
   [arxiv Petals 2312.08361; Parallax 2509.26182; BOINC berkeley]

## SZL FABRIC = abundance + allodial floor (mix into the LiteLLM router)
  Tier 0  allodial solar self-host (own weights, own energy)  <- UNKILLABLE floor, sovereign:true
  Tier 1  betterwithage / dedicated GPU (own metal)           <- sovereign:true
  Tier 2  FREE Chinese/open endpoints (GLM-Flash, SiliconFlow, OVH-anon, Groq, GitHub Models)
          <- free abundance; sovereign:false (not our metal) but open-weight + honestly labeled
  Tier 3  volunteer swarm (Petals/Parallax) for big models    <- decentralized, no landlord
The router tries allodial+own-metal FIRST (sovereign), then free faucets, always reporting
served_by. Free abundance for scale; allodial solar floor so we are NEVER switchable-off.

## WIRE IT (mix free tiers in now; build allodial floor next)
[Forge now] Add the free OpenAI-compatible endpoints above as fallback model_names in the LiteLLM
config (keys via secret store, NEVER committed). Mirror glm-4.6 + qwen2.5-coder weights to the SZL
HF org. Label every free-tier turn served_by + sovereign:false honestly.
[Founder] Stand the solar Tier-0 anchor (Mac mini M4 or efficient box + panel + LiFePO4) — the
allodial, sun-powered, unkillable floor. Then evaluate a Petals/Parallax swarm for 70B+ free.

## Doctrine floor
open-weight ONLY; never commit a key; sovereign:true ONLY on own metal (Tier 0/1); free faucets
are honest sovereign:false; the half-state is the ONLY unacceptable outcome. Free != owned —
we say which. locked=8; Λ=Conj1; BFT=Conj2.
