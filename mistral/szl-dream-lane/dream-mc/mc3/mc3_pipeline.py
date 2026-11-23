# mc3_pipeline.py - dream-mc round 3: Kimi evolves, Astra 6.2 cleans up after Kimi, Sol 6.1 makes it more efficient.
# Zero MC API calls here. Ollama localhost only. Doctrine: GET-only/alert-only tools, key-in-memory, no secrets printed, selftest must stay green.
import json, time, re, urllib.request

BASE = 'http://127.0.0.1:11434/api/chat'
ED = 'C:/SZL/edge-debug'
OUT = ED + '/mc3'
LOG = OUT + '/mc3_pipeline_log.txt'
MODELS = {
    'kimi': 'kimi-k3.1-pro:cloud',
    'astra': 'treyleo16/gpt-6-astra:latest',
    'sol': 'treyleo16/gpt-6-1-sol:latest',
}

def log(msg):
    line = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()) + ' ' + msg
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

def chat(model, prompt, tag, timeout=900):
    t0 = time.time()
    body = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'stream': False}).encode('utf-8')
    req = urllib.request.Request(BASE, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read().decode('utf-8'))
    content = data['message']['content'].strip()
    done = data.get('done_reason', '?')
    hdr = 'MODEL %s\nSECONDS %.1f DONE_REASON %s SIZE %d\n' % (model, time.time() - t0, done, len(content))
    with open(OUT + '/mc3_' + tag + '_out.txt', 'w', encoding='utf-8') as f:
        f.write(hdr + '\n' + content + '\n')
    log('%s done: %.1fs size=%d done_reason=%s' % (tag, time.time() - t0, len(content), done))
    return content

def extract_files(text):
    files = {}
    for m in re.finditer(r'###\s*FILE:\s*`?([A-Za-z0-9_./\\-]+)`?\s*\r?\n```[a-zA-Z]*\r?\n(.*?)```', text, re.S):
        files[m.group(1).strip()] = m.group(2).strip('\r\n') + '\n'
    return files

DOCTRINE = '''STANDING DOCTRINE (non-negotiable, inherited from estate owner):
- Tools are alert-only, zero-write on MC; the snapshot adapter is GET-only; MC key lives in memory only for the Authorization header, NEVER printed, logged, or embedded.
- Never print secrets (keys, tokens, passwords, ssh fields, emails). Whitelisted fields only in summaries.
- Fail-closed and honest: simulated/estimated things must be labeled simulated/estimated; never claim a measurement that was not run.
- Keep CLI contract and JSON output schemas compatible with the round-2 published versions (watchers and receipts depend on them).
'''

SRC_WATCHDOG = read(ED + '/watchdog.py')
SRC_SNAPSHOT = read(ED + '/mc_snapshot.py')
F = chr(96) * 3

KIMI_PROMPT = DOCTRINE + '''You are KIMI, the coder seat of a three-seat crew (round mc3). Owner directive: EVOLVE THEM. While you code, two janitor seats will clean up after you and make your work more efficient, so write your best, complete, working code now; do not leave TODOs or stubs.

Below are the two live tools from round 2 (published on the estate branch). Evolve THEM.

### FILE: watchdog.py (round-2 source, verbatim)
''' + F + 'python\n' + SRC_WATCHDOG + '\n' + F + '''

### FILE: mc_snapshot.py (round-2 source, verbatim)
''' + F + 'python\n' + SRC_SNAPSHOT + '\n' + F + '''

EVOLVE both files with concrete upgrades, e.g.: single-pass evaluation, precompiled/merged alert rules, O(1) lookups, fewer redundant file reads, cleaner typed parsing and stricter redaction, grounded error messages, less startup waste. Fix any real bug you find and note it honestly.

HARD CONSTRAINTS:
- Preserve the CLI: watchdog --selftest FIXTURE_DIR | --config CONFIG | --once SNAPSHOT [--state STATE]; snapshot --out OUT [--fingerprint]. Same JSON schemas ('kind' fields, alert objects, once_summary/selftest_summary shapes).
- The watchdog selftest must stay compatible and PASS on the existing fixtures.
- Zero new network behavior: snapshot stays GET-only to the MC API; watchdog stays offline.
- No new dependencies; stdlib only.

OUTPUT FORMAT (strict):
1. ### FILE: watchdog.py followed by one fenced python block with the COMPLETE evolved file.
2. ### FILE: mc_snapshot.py followed by one fenced python block with the COMPLETE evolved file.
3. A section titled EVOLVE_MANIFEST listing, as concrete one-liners, any bugs found+fixed this round and the top next upgrades you would make to mc_gate_compat.py, batch_local.py and mc_probe.py (one line each; do not write those files).
Max 250 words outside the two file blocks.'''

ASTRA_PROMPT = DOCTRINE + '''You are ASTRA 6.2, the cleanup seat of a three-seat crew (round mc3). Kimi just finished coding (owner directive: evolve the tools). Clean up after Kimi: verify Kimi's code against the round-2 sources below, remove leftover cruft, dead branches, duplicated logic, unused imports, noisy prints; tighten alert wording so nothing ambiguous can be mistaken for a write; keep every behavior and schema intact. If you find a real bug in Kimi's code, FIX it and name it in CLEANUP_NOTES. Do not weaken tests or redaction; you may strengthen them.

KIMI'S FULL OUTPUT:
-------------------
{{KIMI_OUT}}
-------------------

ROUND-2 SOURCES (ground truth for contracts and selftest fixtures):
### FILE: watchdog.py (round-2 source)
''' + F + 'python\n' + SRC_WATCHDOG + '\n' + F + '''

### FILE: mc_snapshot.py (round-2 source)
''' + F + 'python\n' + SRC_SNAPSHOT + '\n' + F + '''

OUTPUT FORMAT (strict): exactly two blocks: ### FILE: watchdog.py and ### FILE: mc_snapshot.py (COMPLETE cleaned files, one fenced python block each), then a section CLEANUP_NOTES with a short bullet list of every fix found (max 10 bullets). No other prose.'''

SOL_PROMPT = DOCTRINE + '''You are SOL 6.1, the efficiency seat of a three-seat crew (round mc3). The code below was evolved by Kimi (coder) and cleaned by Astra 6.2 (cleanup). Owner directive: make it more efficient. Optimize algorithms and I/O (single pass, precompiled patterns, minimal reads/writes, cheaper startup, lower memory), KEEP BEHAVIOR AND SCHEMAS 100 PERCENT IDENTICAL: same outputs on same inputs, selftest still passing on the same fixtures. Efficiency claims you cannot measure here must be labeled estimated. Do not fixate on style; ship lean, working, final code.

KIMI+ASTRA CURRENT VERSIONS:
### FILE: watchdog.py (current)
''' + F + 'python\n{{WD_CUR}}\n' + F + '''

### FILE: mc_snapshot.py (current)
''' + F + 'python\n{{SNAP_CUR}}\n' + F + '''

ROUND-2 SOURCES (contract ground truth):
### FILE: watchdog.py (round-2 source)
''' + F + 'python\n' + SRC_WATCHDOG + '\n' + F + '''

### FILE: mc_snapshot.py (round-2 source)
''' + F + 'python\n' + SRC_SNAPSHOT + '\n' + F + '''

OUTPUT FORMAT (strict): exactly two blocks: ### FILE: watchdog.py and ### FILE: mc_snapshot.py (COMPLETE final files, one fenced python block each), then EFFICIENCY_NOTES with max 8 bullets, each labeling measured vs estimated. No other prose.'''

def main():
    log('mc3 pipeline start; sources: watchdog=%dB snapshot=%dB' % (len(SRC_WATCHDOG), len(SRC_SNAPSHOT)))
    kimi_out = chat(MODELS['kimi'], KIMI_PROMPT, 'kimi')
    kf = extract_files(kimi_out)
    log('stage1 kimi extracted: %s' % sorted(kf.keys()))
    if not kf.get('watchdog.py') or not kf.get('mc_snapshot.py'):
        log('FATAL kimi missing required FILE blocks; honest stop, nothing fabricated')
        return 2
    astra_out = chat(MODELS['astra'], ASTRA_PROMPT.replace('{{KIMI_OUT}}', kimi_out), 'astra')
    af = extract_files(astra_out)
    log('stage2 astra extracted: %s' % sorted(af.keys()))
    if not af.get('watchdog.py') or not af.get('mc_snapshot.py'):
        log('FATAL astra missing required FILE blocks; honest stop')
        return 3
    sol_prompt = SOL_PROMPT.replace('{{WD_CUR}}', af['watchdog.py']).replace('{{SNAP_CUR}}', af['mc_snapshot.py'])
    sol_out = chat(MODELS['sol'], sol_prompt, 'sol')
    sf = extract_files(sol_out)
    log('stage3 sol extracted: %s' % sorted(sf.keys()))
    if not sf.get('watchdog.py') or not sf.get('mc_snapshot.py'):
        log('FATAL sol missing required FILE blocks')
        return 4
    final_wd, final_snap = sf['watchdog.py'], sf['mc_snapshot.py']
    stages = [(OUT + '/watchdog_v2.py', final_wd), (OUT + '/snapshot_v2.py', final_snap),
              (OUT + '/watchdog_v2.kimi.py', kf['watchdog.py']), (OUT + '/watchdog_v2.astra.py', af['watchdog.py']), (OUT + '/watchdog_v2.sol.py', sf['watchdog.py']),
              (OUT + '/snapshot_v2.kimi.py', kf['mc_snapshot.py']), (OUT + '/snapshot_v2.astra.py', af['mc_snapshot.py']), (OUT + '/snapshot_v2.sol.py', sf['mc_snapshot.py'])]
    for path, content in stages:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    log('pipeline complete: watchdog_v2.py %dB, snapshot_v2.py %dB' % (len(final_wd), len(final_snap)))
    with open(OUT + '/mc3_pipeline_done.flag', 'w', encoding='utf-8') as f:
        f.write(time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()) + '\n')
    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
