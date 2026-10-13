# Exact parser/constant excerpt read from SZL canonical source, not a new API model.
# szl-holdings/a11oy@00f52f2e31c9aed93e83e3814410ec1dde08b03c
# routers/atelier_grok.py::_final_output; test harness supplies AtelierFailure/re.
# The excerpt hash is local evidence; it is not a GitHub whole-blob attestation.

_SAFE_PROVIDER_ID = re.compile(r"^[A-Za-z0-9_.:-]{1,200}$")


def _final_output(document, model):
    if not isinstance(document, dict) or document.get("model") != model or document.get("status") != "completed":
        raise AtelierFailure("PROVIDER_INVALID_RESPONSE", 502)
    output = document.get("output")
    if not isinstance(output, list):
        raise AtelierFailure("PROVIDER_INVALID_RESPONSE", 502)
    parts = []
    for item in output:
        if not isinstance(item, dict) or item.get("type") != "message" or item.get("role") != "assistant":
            continue
        if item.get("status", "completed") != "completed":
            raise AtelierFailure("PROVIDER_INVALID_RESPONSE", 502)
        contents = item.get("content")
        if not isinstance(contents, list):
            raise AtelierFailure("PROVIDER_INVALID_RESPONSE", 502)
        for content in contents:
            if isinstance(content, dict) and content.get("type") == "output_text" and isinstance(content.get("text"), str):
                parts.append(content["text"])
    answer = "\n".join(parts)
    if not answer.strip() or len(answer) > 32_768:
        raise AtelierFailure("PROVIDER_INVALID_RESPONSE", 502)
    usage = document.get("usage") or {}
    usage = {key: value for key in ("input_tokens", "output_tokens", "total_tokens")
             if isinstance(usage, dict) and type(value := usage.get(key)) is int and 0 <= value <= 10_000_000}
    provider_id = document.get("id")
    provider_id = provider_id if isinstance(provider_id, str) and _SAFE_PROVIDER_ID.fullmatch(provider_id) else None
    return answer, usage, provider_id
