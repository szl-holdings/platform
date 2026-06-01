"""Produce real ledger entries to demonstrate the reciprocity organism (honest)."""
import json
from dataclasses import asdict
from ayni_os.ledger import ReciprocityLedger
from ayni_os.reciprocity_monitor import scan
from ayni_os.rewind import reconstruct_at

led = ReciprocityLedger()
# t=100: amaru consumes 10 gpu_min supplied by sentra (double-entry pair p1)
led.record_exchange(taker="amaru", giver="sentra", resource="gpu_min",
                    amount=10.0, pair_id="p1", ts=100.0)
# t=200: rosie consumes 5 tokens supplied by vessels (pair p2)
led.record_exchange(taker="rosie", giver="vessels", resource="tokens",
                    amount=5.0, pair_id="p2", ts=200.0)
# t=300: amaru reciprocates -> gives 10 gpu_min back to sentra (closes Ayni p1)
led.reciprocate(organ="sentra", resource="gpu_min", amount=10.0,
                pair_id="p1", ts=300.0)

print(led.to_jsonl())
print("CHAIN_OK:", led.verify_chain())
print("AYNI amaru:", round(led.ayni_coefficient("amaru"), 4),
      "sentra:", round(led.ayni_coefficient("sentra"), 4))
r = scan(led)
print("HALT:", r.halt, "deficits:", [d.organ for d in r.deficits])
st = reconstruct_at(led, target_ts=150.0)
print("REWIND@150 n_entries:", st.n_entries, "amaru bal:", st.balances["amaru"])
