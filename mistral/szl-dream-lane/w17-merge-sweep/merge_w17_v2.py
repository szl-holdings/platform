import json,subprocess,time
GH=r'C:\Program Files\GitHub CLI\gh.exe'
base=r'C:/SZL/edge-debug/w17'
def gh(args):
    r=subprocess.run([GH]+args,capture_output=True,text=True,encoding='utf-8',errors='replace')
    return r.returncode,r.stdout,r.stderr
ver=json.load(open(base+'/w17_verified.json',encoding='utf-8'))['verified_green']
plan=json.load(open(base+'/w17_merge_plan_v2.json',encoding='utf-8'))['plan']['merge_now']
receipts=open(base+'/w17_merge_receipts2.jsonl','a',encoding='utf-8')
log=open(base+'/w17_log.txt','a',encoding='utf-8',buffering=1)
def L(m): log.write(time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())+' merge2 '+m+'\n')
L('sweep2 start candidates='+str(len(plan)))
merged=[];held=[]
for x in plan:
    repo=x['repo']; n=x['number']
    src=[v for v in ver if v['repo']==repo and v['number']==n]
    if not src:
        L('skip '+repo+'#'+str(n)+' not verified'); continue
    v=src[0]
    rc,out,err=gh(['api','repos/%s/pulls/%d'%(repo,n)])
    if rc!=0:
        L('hold '+repo+'#'+str(n)+' GET_FAIL '+err.strip()[:150])
        receipts.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':'get_failed','detail':err.strip()[:200]})+'\n'); held.append((repo,n,'get_fail')); continue
    pr=json.loads(out)
    if pr.get('merged'):
        L('info '+repo+'#'+str(n)+' already merged upstream'); receipts.write(json.dumps({'repo':repo,'number':n,'status':'already_merged'})+'\n'); continue
    st=(pr.get('mergeable_state') or '').lower(); head=(pr.get('head') or {}).get('sha')
    if st!='clean' or head!=v['head']:
        L('hold '+repo+'#'+str(n)+' state='+str(st)+' head='+str(head)[:10]+' verified='+str(v['head'])[:10])
        receipts.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':'drift_or_dirty','state':st,'head':head,'verified_head':v['head']})+'\n'); held.append((repo,n,str(st))); continue
    rc,out,err=gh(['api','-X','PUT','repos/%s/pulls/%d/merge'%(repo,n),'-f','merge_method=squash'])
    if rc==0:
        try: res=json.loads(out) if out.strip() else {}
        except Exception: res={}
        sha=res.get('sha')
        L('MERGED '+repo+'#'+str(n)+' squash sha='+str(sha)[:10])
        receipts.write(json.dumps({'repo':repo,'number':n,'status':'merged','method':'squash','sha':sha,'head':v['head']})+'\n'); merged.append((repo,n)); continue
    e=err.strip()
    lc=e.lower()
    if 'squash' in lc and 'not allowed' in lc:
        rc2,out2,err2=gh(['api','-X','PUT','repos/%s/pulls/%d/merge'%(repo,n),'-f','merge_method=merge'])
        if rc2==0:
            try: res=json.loads(out2) if out2.strip() else {}
            except Exception: res={}
            L('MERGED '+repo+'#'+str(n)+' merge-commit sha='+str(res.get('sha'))[:10])
            receipts.write(json.dumps({'repo':repo,'number':n,'status':'merged','method':'merge','sha':res.get('sha'),'head':v['head']})+'\n'); merged.append((repo,n)); continue
        e=err2.strip()
    L('hold '+repo+'#'+str(n)+' MERGE_FAIL '+e[:150])
    receipts.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':'merge_failed','detail':e[:300]})+'\n'); held.append((repo,n,'merge_fail'))
    time.sleep(1)
L('sweep2 done merged=%d held=%d'%(len(merged),len(held)))
f=open(base+'/w17_merge_summary2.json','w',encoding='utf-8')
f.write(json.dumps({'merged':[{'repo':r,'number':n} for r,n in merged],'held':[{'repo':r,'number':n,'reason':x} for r,n,x in held]},indent=1)); f.close()
