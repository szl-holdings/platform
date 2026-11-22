import json,subprocess,time
GH=r'C:\Program Files\GitHub CLI\gh.exe'
base=r'C:/SZL/edge-debug/w17'
def gh(args):
    r=subprocess.run([GH]+args,capture_output=True,text=True,encoding='utf-8',errors='replace')
    return r.returncode,r.stdout,r.stderr
ver=json.load(open(base+'/w17_verified.json',encoding='utf-8'))['verified_green']
summ=json.load(open(base+'/w17_merge_summary2.json',encoding='utf-8'))
pend=[(h['repo'],h['number']) for h in summ['held'] if h.get('reason')=='unknown']
log=open(base+'/w17_log.txt','a',encoding='utf-8',buffering=1)
rec=open(base+'/w17_merge_receipts2.jsonl','a',encoding='utf-8')
def L(m): log.write(time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())+' merge3 '+m+'\n')
L('retry pass start pending='+str(len(pend)))
merged=[];still=[]
for repo,n in pend:
    v=[x for x in ver if x['repo']==repo and x['number']==n][0]
    done=False
    for attempt in range(1,8):
        rc,out,err=gh(['api','repos/%s/pulls/%d'%(repo,n)])
        if rc==0:
            pr=json.loads(out)
            if pr.get('merged'):
                L('info '+repo+'#'+str(n)+' already merged'); done=True; break
            st=(pr.get('mergeable_state') or '').lower(); head=(pr.get('head') or {}).get('sha')
            if st=='clean' and head==v['head']:
                rc2,out2,err2=gh(['api','-X','PUT','repos/%s/pulls/%d/merge'%(repo,n),'-f','merge_method=squash'])
                if rc2==0:
                    try: res=json.loads(out2) if out2.strip() else {}
                    except Exception: res={}
                    L('MERGED '+repo+'#'+str(n)+' squash attempt='+str(attempt)+' sha='+str(res.get('sha'))[:10])
                    rec.write(json.dumps({'repo':repo,'number':n,'status':'merged','method':'squash','sha':res.get('sha'),'head':v['head'],'retry_attempt':attempt})+'\n')
                    merged.append((repo,n)); done=True; break
                L('hold '+repo+'#'+str(n)+' MERGE_FAIL '+err2.strip()[:140])
                rec.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':'merge_failed','detail':err2.strip()[:280]})+'\n')
                still.append((repo,n,'merge_fail')); done=True; break
            if st=='dirty' or st=='blocked':
                L('hold '+repo+'#'+str(n)+' state='+st+' (hard)')
                rec.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':st})+'\n')
                still.append((repo,n,st)); done=True; break
            if head!=v['head']:
                L('hold '+repo+'#'+str(n)+' head drift head='+str(head)[:10])
                rec.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':'drift','head':head,'verified_head':v['head']})+'\n')
                still.append((repo,n,'drift')); done=True; break
            L('wait '+repo+'#'+str(n)+' state='+st+' attempt='+str(attempt))
        else:
            L('wait '+repo+'#'+str(n)+' GET_FAIL attempt='+str(attempt))
        time.sleep(6)
    if not done:
        L('hold '+repo+'#'+str(n)+' still-unknown after retries')
        rec.write(json.dumps({'repo':repo,'number':n,'status':'hold','reason':'unknown_persisted'})+'\n')
        still.append((repo,n,'unknown_persisted'))
L('retry pass done merged=%d still-held=%d'%(len(merged),len(still)))
f=open(base+'/w17_merge_summary3.json','w',encoding='utf-8')
summ2=json.load(open(base+'/w17_merge_summary2.json',encoding='utf-8'))
allmerged=summ2['merged']+[{'repo':r,'number':n} for r,n in merged]
f.write(json.dumps({'merged':allmerged,'retry_merged':[{'repo':r,'number':n} for r,n in merged],'still_held':[{'repo':r,'number':n,'reason':x} for r,n,x in still]},indent=1)); f.close()
