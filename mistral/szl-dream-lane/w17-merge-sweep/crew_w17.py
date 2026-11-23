# crew_w17.py v3 - W17 crew-as-one lap. v1 died pre-log (unreceipted), v2 measured search-API 502 on composite rollup.
# v3: paged light search (25/page, retry+backoff) + per-candidate REST commit status. Fail-closed, green-only, honest.
import json, time, os, re, subprocess, sys, urllib.request

OUT = 'C:/SZL/edge-debug/w17'
LOGP = OUT + '/w17_log.txt'

def log(m):
    line = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()) + ' ' + m
    print(line)
    with open(LOGP, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def gh(args, tries=4):
    for i in range(tries):
        p = subprocess.run(['gh'] + args, capture_output=True)
        if p.returncode == 0:
            return p.stdout.decode('utf-8', 'replace')
        err = p.stderr.decode('utf-8', 'replace')[:200]
        if b'502' in p.stderr or 'HTTP 502' in err or 'HTTP 5' in err:
            time.sleep(5 * (i + 1))
            continue
        raise RuntimeError('gh rc=' + str(p.returncode) + ' ' + err)
    raise RuntimeError('gh retries exhausted: ' + err)

def ollama(model, prompt, tag, timeout=900):
    t0 = time.time()
    body = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'stream': False}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read().decode('utf-8'))
    c = data['message']['content'].strip()
    hdr = 'MODEL %s\nSECONDS %.1f DONE_REASON %s SIZE %d\n' % (model, time.time() - t0, data.get('done_reason', '?'), len(c))
    with open(OUT + '/w17_' + tag + '_out.txt', 'w', encoding='utf-8') as f:
        f.write(hdr + '\n' + c + '\n')
    log('%s done %.1fs size=%d' % (tag, time.time() - t0, len(c)))
    return c

SEATS = [
    ('kimi',  'kimi-k3.1-pro:cloud',          'GOVERNING + CODER: integrate all seats into the final merge plan; you own merge order and hold rules'),
    ('astra', 'treyleo16/gpt-6-astra:latest', 'CLEANUP SEAT: verify each candidate is truly green (no bandaids, no stale head, no hidden risk); call out anything suspicious'),
    ('sol',   'treyleo16/gpt-6-1-sol:latest', 'EFFICIENCY SEAT: rank candidates by merge value vs waiting cost; flag possible stale checks'),
    ('glm',   'glm-5.3:cloud',                 'WATCHER SEAT (GPT-6 substitute, disclosed: codex rail absent on PATH): adversarial review - what could go wrong merging tonight; which must HOLD'),
    ('mistral','mistral-large-4:cloud',       'REVIEWER SEAT (5th seat, Claude rail absent on device, disclosed): independent second opinion per candidate'),
]

def main():
    os.makedirs(OUT, exist_ok=True)
    log('runner v3 start')
    rows = []
    cursor = ''
    total = 0
    pages = 0
    while True:
        after = (', after: "%s"' % cursor) if cursor else ''
        q = ('query { search(query: "org:szl-holdings is:pr is:open", type: ISSUE, first: 25%s) { '
             'issueCount pageInfo { endCursor hasNextPage } '
             'nodes { ... on PullRequest { '
             'number title isDraft mergeable mergeStateStatus reviewDecision headRefOid '
             'baseRepository { nameWithOwner squashMergeAllowed } '
             '} } } }' % after)
        raw = gh(['api', 'graphql', '-f', 'query=' + q])
        data = json.loads(raw)
        s = data['data']['search']
        total = s['issueCount']
        pages += 1
        for p in s['nodes']:
            rows.append({
                'repo': p['baseRepository']['nameWithOwner'], 'number': p['number'], 'title': p['title'][:110],
                'draft': p['isDraft'], 'mergeable': p['mergeable'], 'mergeState': p['mergeStateStatus'],
                'review': p['reviewDecision'], 'head': p['headRefOid'],
                'squash': p['baseRepository']['squashMergeAllowed'],
                'checks': 'UNVERIFIED',
            })
        if not s['pageInfo']['hasNextPage'] or pages >= 8:
            break
        cursor = s['pageInfo']['endCursor']
    log('sweep paged: issueCount=%d fetched=%d pages=%d' % (total, len(rows), pages))
    with open(OUT + '/w17_pr_sweep.json', 'w', encoding='utf-8') as f:
        json.dump({'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'issueCount': total, 'prs': rows}, f, indent=1)

    def mech(r):
        return (not r['draft'] and r['mergeable'] == 'MERGEABLE' and r['mergeState'] == 'CLEAN'
                and r['review'] != 'CHANGES_REQUESTED')

    mech_cands = [r for r in rows if mech(r)]
    log('mechanical CLEAN candidates: %d' % len(mech_cands))
    # per-candidate REST commit status head verification
    confirmed = []
    for r in mech_cands:
        try:
            repo_path = r['repo'].replace('szl-holdings/', '')
            raw = gh(['api', 'repos/szl-holdings/%s/commits/%s/status' % (repo_path, r['head'])])
            st = json.loads(raw)
            r['checks'] = st.get('state', 'UNKNOWN')
        except Exception as e:
            r['checks'] = 'ERROR ' + str(e)[:80]
        if r['checks'] == 'success':
            confirmed.append(r)
        else:
            log('candidate downgraded %s#%s checks=%s' % (r['repo'], r['number'], r['checks'][:40]))
    log('confirmed green (mergeState CLEAN + commit status success): %d' % len(confirmed))
    with open(OUT + '/w17_green_candidates.json', 'w', encoding='utf-8') as f:
        json.dump(confirmed, f, indent=1)
    classes = {}
    for r in rows:
        classes.setdefault(r['mergeState'] + '|' + str(r['checks']), []).append(r['repo'] + '#' + str(r['number']))
    with open(OUT + '/w17_class_headline.json', 'w', encoding='utf-8') as f:
        json.dump(classes, f, indent=1)

    def line(r):
        return '%s#%d "%s" mergeState=%s checks=%s review=%s squash=%s head=%s' % (
            r['repo'], r['number'], r['title'], r['mergeState'], r['checks'], r['review'], r['squash'], r['head'][:10])

    table = '\n'.join('CAND ' + line(r) for r in confirmed) or 'CAND (none confirmed green)'
    headline = json.dumps({k: len(v) for k, v in classes.items()})
    blocked = '\n'.join(line(r) for r in rows if not mech(r))

    brief = ('OWNER DIRECTIVE (verbatim): "get all pr and merges green and merge if gren go". '
             'We are one crew on a single estate-wide merge sweep of GitHub org szl-holdings. '
             'Doctrine: fail-closed, green-only, never force, never bypass branch protection, honest HOLD reasons, no fabrication. '
             'MERGE-GO requires: mergeable CLEAN (GitHub-verified required checks pass at head), commit status success at head, '
             'no draft, no CHANGES_REQUESTED review, nothing that smells like a bandaid or a rerun-to-green. '
             'Standing estate rule: a merge that fails branch protections must HOLD, receipted, never forced.\n\n'
             'CONFIRMED GREEN CANDIDATES (%d of %d open PRs, rest are not candidates):\n%s\n\n'
             'NON-CANDIDATES (context only, truncated):\n%s\n\n'
             'CLASS HEADLINE: %s\n\n'
             'ANSWER IN FENCED JSON ONLY, max 350 words: "go" = array of repo#number you vote MERGE TONIGHT, '
             '"hold" = array of {pr, reason}, "watch" = your role in one line.') % (
             len(confirmed), len(rows), table, blocked[:4500], headline)

    outs = {}
    for tag, model, role in SEATS:
        prompt = ('You are seat %s in a 5-seat crew. ROLE: %s.\n\n' % (tag, role)) + brief
        try:
            outs[tag] = ollama(model, prompt, tag, 600 if tag == 'kimi' else 240)
        except Exception as e:
            outs[tag] = 'ERROR ' + type(e).__name__ + ': ' + str(e)[:200]
            log('seat %s FAILED honest: %s' % (tag, outs[tag][:160]))

    allseats = '\n\n'.join('### SEAT %s\n%s' % (t, outs[t][:2600]) for t in outs)
    kimi_prompt = ('You are KIMI, GOVERNING seat. Integrate the seat outputs into ONE final merge plan. '
                   'Owner directive: "merge if gren go" (green-only, fail-closed, no forcing, no bypass). '
                   'MERGE-GO only for confirmed green candidates not contradicted by another seat with a concrete risk; anything questionable HOLDS.\n'
                   'CONFIRMED:\n%s\n\nSEAT OUTPUTS:\n%s\n\n'
                   'ANSWER IN FENCED JSON ONLY: {"merge_now": ["repo#n"], "hold": [{"pr": "repo#n", "reason": "..."}], '
                   '"merge_method": "squash where allowed else merge", "notes": "max 60 words"}.') % (table, allseats)
    try:
        outs['kimi_ruling'] = ollama('kimi-k3.1-pro:cloud', kimi_prompt, 'kimi_ruling', 600)
    except Exception as e:
        outs['kimi_ruling'] = 'ERROR ' + str(e)[:200]
        log('kimi_ruling FAILED honest')

    m = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', outs['kimi_ruling'], re.S)
    plan = None
    if m:
        try:
            plan = json.loads(m.group(1))
        except Exception as e:
            log('kimi_ruling JSON parse failed honest: ' + str(e)[:120])
    with open(OUT + '/w17_merge_plan.json', 'w', encoding='utf-8') as f:
        json.dump({'parse_ok': plan is not None, 'plan': plan,
                   'confirmed_candidates': [r['repo'] + '#' + str(r['number']) for r in confirmed]}, f, indent=1)
    log('crew lap complete: plan parse_ok=%s confirmed=%d' % (plan is not None, len(confirmed)))
    return 0

if __name__ == '__main__':
    sys.exit(main())
