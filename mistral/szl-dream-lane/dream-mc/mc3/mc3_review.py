# mc3_review.py - extract seat notes (prose outside FILE code blocks) + security/contract scan of evolved finals.
import re, os

ED = 'C:/SZL/edge-debug'
OUT = ED + '/mc3'

def prose_blocks(text):
    # drop fenced code blocks, keep surrounding prose
    no_code = re.sub(r'```.*?```', '[CODE BLOCK]', text, flags=re.S)
    lines = [ln.strip() for ln in no_code.splitlines() if ln.strip()]
    return '\n'.join(lines)

for tag in ['kimi', 'astra', 'sol']:
    p = os.path.join(OUT, 'mc3_' + tag + '_out.txt')
    with open(p, encoding='utf-8') as f:
        t = f.read()
    head = t.splitlines()[:2]
    print('=== %s header: %s' % (tag, ' | '.join(head)))
    pr = prose_blocks(t)
    pr = re.sub(r'\[CODE BLOCK\](\s*\[CODE BLOCK\])+', '[CODE BLOCKS]', pr)
    m = re.search(r'(EVOLVE_MANIFEST|CLEANUP_NOTES|EFFICIENCY_NOTES)', pr)
    idx = m.start() if m else 0
    print('--- %s notes ---' % tag)
    print(pr[idx:idx + 1400])
    print()

for name in ['watchdog_v2.py', 'snapshot_v2.py']:
    p = os.path.join(OUT, name)
    with open(p, encoding='utf-8') as f:
        src = f.read()
    print('=== SECURITY SCAN %s (%dB) ===' % (name, len(src)))
    for pat in ['POST', 'PUT', 'DELETE', 'requests.post', 'ssh', 'password', 'email']:
        hits = [i + 1 for i, ln in enumerate(src.splitlines()) if pat.lower() in ln.lower()]
        print('  %-14s: %s' % (pat, hits if hits else 'none'))
    for i, ln in enumerate(src.splitlines()):
        if re.search(r'print\s*\([^)]*\b(key|token|secret|password)', ln, re.I):
            print('  SECRET-PRINT CANDIDATE line %d: %s' % (i + 1, ln.strip()[:100]))
    http = [i + 1 for i, ln in enumerate(src.splitlines()) if 'http' in ln.lower()]
    print('  http mentions : lines %s' % (http if http else 'none'))
    auth = [i + 1 for i, ln in enumerate(src.splitlines()) if 'Authorization' in ln or 'Bearer' in ln]
    print('  auth headers  : lines %s' % (auth if auth else 'none'))
    print()
