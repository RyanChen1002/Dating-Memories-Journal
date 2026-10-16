// Browser test fixture only. Install with Playwright routing; never loaded by production HTML.
(() => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'qa@example.invalid' };
    const state = window.__qa = {
        user, fail: null, calls: [], objects: {},
        tables: { memories: [
            { id:'m1', user_id:user.id, date:'2025-04-20', caption:'Kyoto safe <b>text</b>', location_name:"Kyoto's park",location_lat:35.01,location_lng:135.76,mood:'🌸',photo_url:'/assets/bg-velvet.png',photo_urls:[],deleted_at:null },
            { id:'m2', user_id:user.id, date:'2026-01-01', caption:'New year',location_name:'Equator',location_lat:0,location_lng:0,mood:'✨',photo_url:'/assets/bg-timeline.png',photo_urls:[],deleted_at:null }
        ],couple_profiles:[],journal_plans:[],anniversaries:[],audit_logs:[] }
    };
    const clone = x => JSON.parse(JSON.stringify(x));
    function from(table) {
        let operation='select',payload=null,filters=[],sort=null,one=false,optional=false;
        const api={
            select(){return api;}, insert(p){operation='insert';payload=p;return api;},upsert(p){operation='upsert';payload=p;return api;},update(p){operation='update';payload=p;return api;},delete(){operation='delete';return api;},
            eq(k,v){filters.push(r=>r[k]===v);return api;},neq(k,v){filters.push(r=>r[k]!==v);return api;},is(k,v){filters.push(r=>(r[k]??null)===v);return api;},in(k,v){filters.push(r=>v.includes(r[k]));return api;},not(k,op,v){filters.push(r=>op==='is'?r[k]!=v:r[k]!==v);return api;},
            order(k,opts={}){sort=[k,opts.ascending!==false];return api;},limit(){return api;},single(){one=true;return api;},maybeSingle(){one=true;optional=true;return api;},
            then(resolve,reject){return Promise.resolve().then(()=>{
                state.calls.push({table,operation});
                if(state.fail===table||state.fail===operation)return {data:null,error:{code:'TEST',message:'QA injected failure'}};
                if(!state.tables[table])return {data:null,error:{code:'42P01',message:'Table not ready'}};
                let rows=state.tables[table],selected=rows.filter(r=>filters.every(f=>f(r)));
                if(operation==='insert'||operation==='upsert'){
                    selected=[];for(const item of Array.isArray(payload)?payload:[payload]){
                        const existing=operation==='upsert'?rows.find(r=>r.user_id===item.user_id):null;
                        if(existing){Object.assign(existing,clone(item));selected.push(existing);}
                        else {const row={id:crypto.randomUUID(),created_at:new Date().toISOString(),deleted_at:null,completed:false,...clone(item)};rows.push(row);selected.push(row);}
                    }
                }
                if(operation==='update')selected.forEach(row=>Object.assign(row,clone(payload)));
                if(operation==='delete')state.tables[table]=rows.filter(row=>!selected.includes(row));
                if(sort)selected.sort((a,b)=>String(a[sort[0]]).localeCompare(String(b[sort[0]]))*(sort[1]?1:-1));
                if(one&&!selected.length&&!optional)return {data:null,error:{message:'No row'}};
                return {data:clone(one?(selected[0]||null):selected),error:null};
            }).then(resolve,reject);}
        };return api;
    }
    const sb={from,auth:{getUser:async()=>({data:{user:state.user},error:null}),getSession:async()=>({data:{session:state.user?{user:state.user}:null},error:null}),onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{state.user=null;return {error:null};}},storage:{from:bucket=>({
        upload:async(path,file)=>{if(state.fail==='upload')return {error:{message:'Upload failed'}};state.objects[bucket+'/'+path]=file;return {data:{path},error:null};},
        createSignedUrl:async path=>({data:{signedUrl:'/assets/bg-velvet.png?qa='+encodeURIComponent(path)},error:null}),
        createSignedUrls:async paths=>({data:paths.map(path=>({path,signedUrl:'/assets/bg-velvet.png?qa='+encodeURIComponent(path)})),error:null}),
        getPublicUrl:path=>({data:{publicUrl:'/assets/bg-velvet.png?qa='+encodeURIComponent(path)}}),
        download:async path=>({data:state.objects[bucket+'/'+path]||new Blob(['test'],{type:'image/jpeg'}),error:null}),
        remove:async paths=>{if(state.fail==='remove')return {error:{message:'Cleanup failed'}};paths.forEach(p=>delete state.objects[bucket+'/'+p]);return {data:paths.map(name=>({name})),error:null};}
    })}};
    window.supabase={createClient:()=>sb};
})();
