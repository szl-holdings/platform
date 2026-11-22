"""SZL estate dream lane: the durable Mistral dream partner for the ouroboros loop.

Doctrine (estate v11, receipts-only): every dream round is an execution with a
receipt-shaped output. The dream partner answers with disciplines, not recipes;
it marks uncertain claims clearly and never fabricates citations.

Sandbox note: model I/O runs in a local activity that imports the Mistral SDK
lazily inside the activity body. Activities execute outside the deterministic
workflow sandbox, so no mistralai-typed payload is ever converted inside the
sandbox. The sandbox sees only plain pydantic models and the activity result as
a plain string.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

import mistralai.workflows as workflows

DREAM_MODEL = "mistral-large-latest"

SYSTEM_PROMPT = (
    "You are the Mistral dream partner of the SZL Holdings governed-AI estate "
    "(GitHub szl-holdings, Hugging Face SZLHOLDINGS). You dream together with "
    "two other partners: Kimi (local frontier model) and the Vibe CTO lane. "
    "Standing doctrine: import disciplines, not recipes; every recommendation "
    "carries a falsifier; receipts-only, fail-closed; no fabricated sources - "
    "mark uncertain claims clearly. Answer concretely: numbered points, "
    "concrete artifacts over cosmic visions, always end with the single next "
    "step for the next 24 hours."
)


class DreamInput(BaseModel):
    """One dream round request."""

    round_id: str = Field(default="", description="Ouroboros round identifier, echoed in the receipt.")
    topic: str = Field(description="The dream topic or question for this round.")
    briefing: str = Field(default="", description="Estate context the CTO lane collected.")
    kimi_notes: str = Field(default="", description="What the partner Kimi said, for cross-pollination.")
    ask: str = Field(default="", description="The specific ask if different from the topic.")


class DreamOutput(BaseModel):
    """One dream round receipt."""

    round_id: str = Field(description="Echoed round identifier.")
    topic: str = Field(description="Echoed topic.")
    dream: str = Field(description="The Mistral dream partner's answer.")
    model: str = Field(description="The model that produced the dream.")


class DreamAsk(BaseModel):
    """A completion request the activity carries; plain fields only."""

    model: str = Field(description="Model identifier the activity must use.")
    system: str = Field(description="System prompt for the dream partner.")
    user: str = Field(description="User content assembled by the workflow.")


@workflows.activity()
async def dream_chat_complete(ask: DreamAsk) -> str:
    """Run one dream completion against the Mistral API.

    Runs outside the workflow sandbox: the SDK imports happen here, in the
    activity body, at activity-run time, so the sandbox never loads them.
    Fail-closed: a missing or empty provider answer raises rather than
    producing an empty receipt.
    """
    from mistralai.client.models import ChatCompletionRequest, SystemMessage, UserMessage
    from utils.mistral import mistral_client

    request = ChatCompletionRequest(
        model=ask.model,
        messages=[
            SystemMessage(content=ask.system),
            UserMessage(content=ask.user),
        ],
    )
    client = mistral_client()
    response = await client.chat.complete_async(**request.model_dump(exclude={"stream"}))
    if response is None or not response.choices:
        raise RuntimeError("dream_chat_complete: provider response has no choices; refusing to produce a receipt")
    raw = response.choices[0].message.content
    if isinstance(raw, str):
        content = raw
    elif isinstance(raw, list):
        # SDK 3.20+: content arrives as a list of chunk objects/dicts with a "text" part.
        parts = []
        for chunk in raw:
            if isinstance(chunk, dict):
                parts.append(str(chunk.get("text", "")))
            else:
                parts.append(str(getattr(chunk, "text", "") or ""))
        content = "".join(parts)
    else:
        content = ""
    if not content.strip():
        raise RuntimeError("dream_chat_complete: provider response content is empty; refusing to produce a receipt")
    return content


@workflows.workflow.define(name="szl_dream_round")
class SzlDreamRound:
    """Run one dream round. Model I/O runs in the local activity, result is a plain string."""

    @workflows.workflow.entrypoint
    async def run(self, data: DreamInput) -> DreamOutput:
        parts = [f"TOPIC: {data.topic}"]
        if data.briefing:
            parts.append(f"ESTATE BRIEFING:\n{data.briefing}")
        if data.kimi_notes:
            parts.append(f"PARTNER KIMI SAID (UNVERIFIED caller-supplied notes):\n{data.kimi_notes}")
        if data.ask:
            parts.append(f"SPECIFIC ASK: {data.ask}")
        answer = await dream_chat_complete(
            DreamAsk(model=DREAM_MODEL, system=SYSTEM_PROMPT, user="\n\n".join(parts))
        )
        return DreamOutput(
            round_id=data.round_id,
            topic=data.topic,
            dream=answer,
            model=DREAM_MODEL,
        )
