# verify_w17.py - W17 lap stage 2: correct-instrument verification of the 27 CLEAN|pending candidates.
# check-runs at EXACT head sha; green only if every check run conclusion is success/neutral/skipped and none pending.
import json, time, re, subprocess, sys, urllib.request

OUT = 'C:/SZL/edge-debug/w17'
LOGP = OUT + '/w17_log.txt'

def log(m):
    line = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()) + ' verify ' + m
    print(line)
    with open(LOGP, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def gh_api(path):
    p = subprocess.run(['gh', 'api', path], capture_output=True)
    if p.returncode != 0:
        raise RuntimeError('gh api rc=' + str(p.returncode) + ' ' + p.stderr.decode('utf-8', 'replace')[:160])
    return json.loads(p.stdout.decode('utf-8'))

def ollama(model, prompt, tag, timeout=600):
    t0 = time.time()
    body = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'stream': False}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read().decode('utf-8'))
    c = data['message']['content'].strip()
    with open(OUT + '/w17_' + tag + '_out.txt', 'w', encoding='utf-8') as f:
        f.write('MODEL %s\nSECONDS %.1f DONE_REASON %s SIZE %d\n\n' % (model, time.time() - t0, data.get('done_reason', '?'), len(c)) + c + '\n')
    log('%s done %.1fs size=%d' % (tag, time.time() - t0, len(c)))
    return c

def main():
    with open(OUT + '/w17_pr_sweep.json', encoding='utf-8') as sf:
        sweep = json.load(sf)
    rows = sweep['prs']
    cands = [r for r in rows if r['mergeState'] == 'CLEAN' and not r['draft'] and r['review'] != 'CHANGES_REQUESTED']
    log('candidates to verify with check-runs: %d' % len(cands))
    verified, still = [], []
    for r in cands:
        repo = r['repo'].replace('szl-holdings/', '')
        try:
            cr = gh_api('repos/szl-holdings/%s/commits/%s/check-runs?per_page=100' % (repo, r['head']))
            runs = cr.get('check_runs', [])
            conclusions = sorted({run.get('conclusion') or 'RUNNING' for run in runs})
            statuses = sorted({run.get('status') or '?' for run in runs})
            r['check_runs'] = len(runs)
            if not runs:
                r['verified'] = 'NO_CHECKS'
                still.append(r)
            elif all(c in ('success', 'neutral', 'skipped') for c in conclusions) and 'completed' in statuses and set(statuses) == {'completed'}:
                r['verified'] = 'ALL_SUCCESS_AT_HEAD'
                r['conclusions'] = conclusions
                verified.append(r)
            else:
                r['verified'] = 'NOT_GREEN ' + ','.join(statuses) + '/' + ','.join(conclusions)
                still.append(r)
            log('%s#%s -> %s (%d runs)' % (r['repo'], r['number'], r['verified'], len(runs)))
        except Exception as e:
            r['verified'] = 'ERROR ' + str(e)[:80]
            still.append(r)
            log('%s#%s ERROR %s' % (r['repo'], r['number'], str(e)[:80]))
    with open(OUT + '/w17_verified.json', 'w', encoding='utf-8') as vf:
        json.dump({'verified_green': verified, 'not_green': still}, vf, indent=1)
    log('verified ALL_SUCCESS_AT_HEAD: %d; not green: %d' % (len(verified), len(still)))

    # fresh binding ruling from Kimi on the correctly-verified table
    def line(r):
        return '%s#%d "%s" mergeState=%s review=%s squash=%s head=%s checks=%s' % (
            r['repo'], r['number'], r['title'][:70], r['mergeState'], r['review'], r['squash'], r['head'][:10], r.get('verified'))
    table = '\n'.join('VERIFIED ' + line(r) for r in verified) or 'VERIFIED (none)'
    prompt = ('You are KIMI, GOVERNING seat, final ruling for the estate-wide merge sweep (round 2, corrected instrument). '
              'Owner directive verbatim: "get all pr and merges green and merge if gren go". '
              'Earlier round: 119 open PRs, zero merges (fail-closed). Now the %d CLEAN candidates have been re-verified with the correct '
              'instrument: GitHub check-runs AT the exact head sha, every run completed with success/neutral/skipped conclusions. '
              'Doctrine: merge only verified green, one at a time, dependency-first, never force, never bypass protection; '
              'if a merge fails branch protection it HOLDS receipted.\n\n'
              'VERIFIED-GREEN-AT-HEAD CANDIDATES:\n%s\n\n'
              'ANSWER IN FENCED JSON ONLY: {"merge_now": [{"repo":"szl-holdings/x","number":n}...], '
              '"hold": [{"pr":"...","reason":"..."}], "order_note":"dependency order in one line", "notes":"max 50 words"}. '
              'Put in merge_now ONLY candidates you affirm GREEN-AT-HEAD and safe to squash-merge tonight.') % (len(verified), table)
    try:
        out = ollama('kimi-k3.1-pro:cloud', prompt, 'kimi_ruling2', 600)
    except Exception as e:
        log('kimi_ruling2 FAILED honest: ' + str(e)[:160])
        return 3
    m = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', out, re.S)
    plan = None
    if m:
        try:
            plan = json.loads(m.group(1))
        except Exception as e:
            log('ruling2 parse fail honest: ' + str(e)[:120])
    with open(OUT + '/w17_merge_plan_v2.json', 'w', encoding='utf-8') as pf:
        json.dump({'parse_ok': plan is not None, 'plan': plan}, pf, indent=1)
    log('ruling2 parse_ok=%s' % (plan is not None))
    return 0

if __name__ == '__main__':
    sys.exit(main())
