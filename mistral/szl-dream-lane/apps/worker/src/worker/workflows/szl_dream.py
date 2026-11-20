"""SZL estate dream lane: the durable Mistral dream partner for the ouroboros loop.

Doctrine (estate v11, receipts-only): every dream round is an execution with a
receipt-shaped output. The dream partner answers with disciplines, not recipes;
it marks uncertain claims clearly and never fabricates citations.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

import mistralai.workflows as workflows
from mistralai.workflows.plugins.mistralai import (
    ChatCompletionRequest,
    SystemMessage,
    UserMessage,
    mistralai_chat_complete,
)

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


@workflows.workflow.define(name="szl_dream_round")
class SzlDreamRound:
    """Run one dream round. Model I/O runs in the plugin activity."""

    @workflows.workflow.entrypoint
    async def run(self, data: DreamInput) -> DreamOutput:
        parts = [f"TOPIC: {data.topic}"]
        if data.briefing:
            parts.append(f"ESTATE BRIEFING:\n{data.briefing}")
        if data.kimi_notes:
            parts.append(f"PARTNER KIMI SAID:\n{data.kimi_notes}")
        if data.ask:
            parts.append(f"SPECIFIC ASK: {data.ask}")
        request = ChatCompletionRequest(
            model=DREAM_MODEL,
            messages=[
                SystemMessage(content=SYSTEM_PROMPT),
                UserMessage(content="\n\n".join(parts)),
            ],
        )
        result = await mistralai_chat_complete(request)
        dream = result.choices[0].message.content or ""
        return DreamOutput(
            round_id=data.round_id,
            topic=data.topic,
            dream=dream,
            model=DREAM_MODEL,
        )
