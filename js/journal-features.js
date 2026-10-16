/* Profile, plans and anniversary UI. No build step; cloud writes are owner scoped. */
(() => {
    const words = {
        nav_timeline: ['Memories', '回忆'], nav_map: ['Our map', '足迹'], nav_plans: ['Plans', '计划'], nav_profile: ['Us', '我们'],
        profile_names: ['Our names', '我们的名字'], relationship_start: ['Together since', '恋爱开始日期'], save_profile: ['Save profile', '保存资料'],
        anniversaries: ['Anniversaries', '纪念日'], event_name: ['Event name', '纪念日名称'], event_date: ['Date', '日期'], repeat_yearly: ['Repeat yearly', '每年重复'], add_anniversary: ['Add anniversary', '添加纪念日'],
        fx_off: ['No animation', '关闭动画'], export_journal: ['Export journal', '导出日记'], year_review: ['Year in review', '年度回顾'], recycle_bin: ['Recycle bin', '回收站'],
        plans_intro: ['Small plans, beautiful memories.', '把小小的计划，变成美好的回忆。'], plan_details: ['Plan details', '计划详情'], plan_title: ['Title', '标题'],
        plan_budget: ['Budget (your currency)', '预算（按你使用的货币）'], plan_checklist: ['Checklist (one task per line)', '准备清单（每行一项）'], plan_notes: ['Notes', '备注'], plan_completed: ['Completed', '已完成'], save_plan: ['Save plan', '保存计划'],
        review_year: ['Year', '年份'], download_card: ['Download card', '下载回顾卡片'], saved: ['Saved to the cloud.', '已保存到云端。'], saving: ['Saving…', '正在保存…'],
        cloud_setup: ['Cloud features are not ready. Your input has been kept; please contact the site owner.', '云端功能暂未就绪，填写内容已保留，请联系网站维护者。'],
        no_plans: ['No plans yet. Add your next little adventure.', '还没有计划，添加你们下一次小小的冒险吧。'], no_anniversaries: ['Add a day worth remembering.', '添加一个值得纪念的日子。'],
        convert_memory: ['Turn into a memory', '记录为回忆'], edit_plan: ['Edit', '编辑'], remove: ['Delete', '删除'], delete_plan_confirm: ['Delete this plan permanently?', '永久删除这条计划？'], delete_event_confirm: ['Delete this anniversary?', '删除这个纪念日？'],
        event_today: ['Today!', '就是今天！'], days_left: ['days to go', '天后'], days_ago: ['days ago', '天前'], no_date: ['Date not set', '日期待定'], pending: ['Planned', '进行中'],
        profile_invalid_date: ['Start date cannot be in the future.', '恋爱开始日期不能在未来。'], image_invalid: ['Choose a JPEG, PNG or WebP image under 10 MB.', '请选择不超过 10 MB 的 JPEG、PNG 或 WebP 图片。'],
        cleanup_failed: ['Saved, but an old photo could not be removed. Please retry cleanup later.', '已保存，但旧照片清理失败，请稍后重试清理。'], photo_retry: ['Retry photo cleanup', '重试照片清理'],
        no_review: ['No memories for this year yet.', '这一年还没有回忆。'], export_notice: ['Export includes your private journal. Keep the downloaded file safe.', '导出文件包含私人日记，请妥善保管。'],
        convert_date: ['This plan is in the future. Create a memory after the date arrives.', '这条计划还没到日期，到时再记录回忆吧。'], plan_complete_failed: ['Memory saved, but the plan status could not be updated. Retry in Plans.', '回忆已保存，但计划状态更新失败，请在计划中重试。'],
        animation_failed: ['Animation unavailable. Static background is active.', '动画暂不可用，已切换为静态背景。'], generic_error: ['Something went wrong. Please retry.', '操作失败，请重试。']
    };
    const tr = key => words[key]?.[window.currentLang === 'zh' ? 1 : 0] || window.t?.(key) || key;
    if (window.translations) for (const [key, pair] of Object.entries(words)) { window.translations.en[key] = pair[0]; window.translations.zh[key] = pair[1]; }
    const $ = id => document.getElementById(id);
    const node = (tag, text, cls) => { const el = document.createElement(tag); if (text != null) el.textContent = text; if (cls) el.className = cls; return el; };
    const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const ordinal = value => { const [y,m,d] = value.split('-').map(Number); return Date.UTC(y,m-1,d) / 86400000; };
    function nextEvent(date, annual, today = localDay()) {
        if (!annual) return date;
        const [year] = today.split('-').map(Number), [,month,day] = date.split('-').map(Number);
        const candidate = y => `${y}-${String(month).padStart(2,'0')}-${String(Math.min(day, new Date(y,month,0).getDate())).padStart(2,'0')}`;
        return candidate(year) < today ? candidate(year+1) : candidate(year);
    }
    window.JournalFeaturesUtils = { nextEvent, ordinal, localDay };
    document.addEventListener('DOMContentLoaded', async () => {
        if (!$('profileForm')) return;
        const sb = window.supabaseClient;
        let user, profile = {}, plans = [], events = [], editPlan = null, activeView = 'timeline';
        let pendingAvatarCleanup = [], fxVersion = 0;
        const notice = (message, error = false) => { $('journalNotice').textContent = message; $('journalNotice').className = `app-notice${error ? ' error' : ''}`; };
        const errorText = err => ['42P01','42703','PGRST204','PGRST205'].includes(err?.code) ? tr('cloud_setup') : (err?.message || tr('generic_error'));
        const action = (label, callback) => { const b = node('button', tr(label), 'btn-secondary'); b.type = 'button'; b.addEventListener('click', async () => { if(b.disabled)return; b.disabled=true; try { await callback(); } catch(e) { notice(errorText(e), true); } finally { b.disabled=false; } }); return b; };
        const ensureUser = () => { if (!user) throw new Error(tr('generic_error')); };
        function selectView(view) {
            activeView = view;
            document.querySelectorAll('[data-panel]').forEach(el => el.classList.toggle('active-panel', el.dataset.panel === view));
            document.querySelectorAll('[data-view]').forEach(el => { if(el.dataset.view === view) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
            $('fabAdd').classList.toggle('hidden', view !== 'timeline');
            if (matchMedia('(min-width:1101px)').matches) document.querySelector(`[data-panel="${view}"]`)?.scrollIntoView({block:'nearest'});
        }
        document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => selectView(el.dataset.view)));
        document.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => {
            if (el.dataset.action === 'map') window.journal?.openMap();
            if (el.dataset.action === 'trash') window.journal?.openTrash();
        }));
        document.querySelectorAll('[data-close-dialog]').forEach(el => el.addEventListener('click', () => $(el.dataset.closeDialog).close()));
        selectView(activeView);
        $('relationshipStart').max = localDay();
        async function setAtmosphere(value, persist = true) {
            const version = ++fxVersion;
            $('atmosphereSelect').disabled = true;
            try {
                await window.setRomanticFX(value);
                if (version === fxVersion && persist) localStorage.setItem('journal_atmosphere',value);
            } catch(e) { await window.setRomanticFX('off'); notice(tr('animation_failed'), true); }
            finally { if(version === fxVersion) $('atmosphereSelect').disabled=false; }
        }
        const reduced = matchMedia('(prefers-reduced-motion: reduce)');
        const initialFX = reduced.matches ? 'off' : (localStorage.getItem('journal_atmosphere') || 'waves_light');
        $('atmosphereSelect').value = [...$('atmosphereSelect').options].some(o => o.value === initialFX) ? initialFX : 'off';
        setAtmosphere($('atmosphereSelect').value, false);
        $('atmosphereSelect').addEventListener('change', e => setAtmosphere(e.target.value));
        reduced.addEventListener('change', e => { if(e.matches) { $('atmosphereSelect').value='off'; setAtmosphere('off', false); } });
        function renderEvents() {
            const root = $('anniversaryList'); root.replaceChildren();
            if(!events.length) root.append(node('p',tr('no_anniversaries')));
            const today = localDay();
            [...events].sort((a,b)=>nextEvent(a.date,a.annual).localeCompare(nextEvent(b.date,b.annual))).forEach(event => {
                const card=node('article',null,'anniversary-card'); const days=ordinal(nextEvent(event.date,event.annual))-ordinal(today);
                card.append(node('strong',event.title),node('p',`${nextEvent(event.date,event.annual)} · ${days===0 ? tr('event_today') : `${Math.abs(days)} ${tr(days>0 ? 'days_left':'days_ago')}`}`));
                card.append(action('remove',async()=>{if(!confirm(tr('delete_event_confirm')))return;const {error}=await sb.from('anniversaries').delete().eq('id',event.id).eq('user_id',user.id);if(error)throw error;events=events.filter(e=>e.id!==event.id);renderEvents();}));
                root.append(card);
            });
        }
        function renderPlans() {
            const root=$('planList');root.replaceChildren();
            if(!plans.length)root.append(node('p',tr('no_plans')));
            [...plans].sort((a,b)=>Number(a.completed)-Number(b.completed)||(a.plan_date||'9999').localeCompare(b.plan_date||'9999')).forEach(plan=>{
                const card=node('article',null,`plan-card${plan.completed?' completed':''}`);
                card.append(node('h3',plan.title),node('p',`${plan.plan_date||tr('no_date')} · ${tr(plan.completed?'plan_completed':'pending')}`));
                if(plan.budget!=null)card.append(node('p',`${tr('plan_budget')}: ${Number(plan.budget).toLocaleString()}`));
                (Array.isArray(plan.checklist)?plan.checklist:[]).forEach((task,index)=>{
                    const label=node('label',null,'plan-check'),input=node('input');input.type='checkbox';input.checked=!!task.done;
                    input.addEventListener('change',async()=>{input.disabled=true;const previous=!!plan.checklist[index].done;const next=plan.checklist.map((t,i)=>i===index?{...t,done:input.checked}:t);try{const {error}=await sb.from('journal_plans').update({checklist:next}).eq('id',plan.id).eq('user_id',user.id);if(error)throw error;plan.checklist=next;}catch(e){input.checked=previous;notice(errorText(e),true);}finally{input.disabled=false;}});
                    label.append(input,node('span',task.text));card.append(label);
                });
                if(plan.notes) { const note=node('p',plan.notes);note.style.whiteSpace='pre-wrap';card.append(note); }
                card.append(action('edit_plan',()=>openPlan(plan)));
                card.append(action('convert_memory',()=>{if(plan.plan_date && plan.plan_date>localDay()) {notice(tr('convert_date'),true);return;}selectView('timeline');window.journal?.openNew({caption:plan.title+(plan.notes?'\n'+plan.notes:''),date:plan.plan_date||localDay(),plan_id:plan.id});}));
                card.append(action('remove',async()=>{if(!confirm(tr('delete_plan_confirm')))return;const {error}=await sb.from('journal_plans').delete().eq('id',plan.id).eq('user_id',user.id);if(error)throw error;plans=plans.filter(p=>p.id!==plan.id);renderPlans();}));root.append(card);
            });
        }
        function openPlan(plan=null) {
            editPlan=plan;$('planForm').reset();$('planStatus').textContent='';
            $('planTitle').value=plan?.title||'';$('planDate').value=plan?.plan_date||'';$('planBudget').value=plan?.budget??'';
            $('planChecklist').value=(plan?.checklist||[]).map(t=>t.text).join('\n');$('planNotes').value=plan?.notes||'';$('planCompleted').checked=!!plan?.completed;
            $('planEditor').showModal();$('planTitle').focus();
        }
        $('addPlanBtn').addEventListener('click',()=>openPlan());
        $('planForm').addEventListener('submit',async e=>{
            e.preventDefault();const btn=e.submitter;if(btn.disabled)return;btn.disabled=true;$('planStatus').textContent=tr('saving');
            try{
                ensureUser();const title=$('planTitle').value.trim();if(!title)throw new Error(tr('plan_title'));
                const budget=$('planBudget').value===''?null:Number($('planBudget').value);if(budget!=null&&(!Number.isFinite(budget)||budget<0))throw new Error(tr('plan_budget'));
                const checklist=$('planChecklist').value.split('\n').map(s=>s.trim()).filter(Boolean).map(text=>({text,done:!!editPlan?.checklist?.find(t=>t.text===text)?.done}));
                const payload={title,plan_date:$('planDate').value||null,budget,checklist,notes:$('planNotes').value.trim(),completed:$('planCompleted').checked};
                const q=editPlan?sb.from('journal_plans').update(payload).eq('id',editPlan.id).eq('user_id',user.id):sb.from('journal_plans').insert({...payload,user_id:user.id});
                const {data,error}=await q.select().single();if(error)throw error;plans=plans.filter(p=>p.id!==data.id);plans.push(data);renderPlans();$('planEditor').close();notice(tr('saved'));
            }catch(err){$('planStatus').textContent=errorText(err);}finally{btn.disabled=false;}
        });
        $('anniversaryForm').addEventListener('submit',async e=>{
            e.preventDefault();const btn=e.submitter;if(btn.disabled)return;btn.disabled=true;
            try{ensureUser();const title=$('anniversaryTitle').value.trim();if(!title)throw new Error(tr('event_name'));const {data,error}=await sb.from('anniversaries').insert({user_id:user.id,title,date:$('anniversaryDate').value,annual:$('anniversaryAnnual').checked}).select().single();if(error)throw error;events.push(data);renderEvents();$('anniversaryForm').reset();notice(tr('saved'));}catch(err){notice(errorText(err),true);}finally{btn.disabled=false;}
        });
        async function cleanupAvatars() {
            if(!pendingAvatarCleanup.length)return;
            const {error}=await sb.storage.from('journal-media').remove(pendingAvatarCleanup);if(error)throw error;pendingAvatarCleanup=[];
        }
        const retry=action('photo_retry',async()=>{await cleanupAvatars();retry.classList.add('hidden');notice(tr('saved'));});retry.classList.add('hidden');$('profileForm').append(retry);
        $('profileForm').addEventListener('submit',async e=>{
            e.preventDefault();const btn=e.submitter;if(btn.disabled)return;btn.disabled=true;$('profileStatus').textContent=tr('saving');let newPath=null,committed=false;
            try{
                ensureUser();const display_name=$('profileName').value.trim(),start_date=$('relationshipStart').value||null;
                if(!display_name)throw new Error(tr('profile_names'));if(start_date&&start_date>localDay())throw new Error(tr('profile_invalid_date'));
                const file=$('profilePicUpload').files[0];let avatar_path=profile.avatar_path||null;
                if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error(tr('image_invalid'));try{const bitmap=await createImageBitmap(file);bitmap.close();}catch{throw new Error(tr('image_invalid'));}newPath=`${user.id}/avatar-${crypto.randomUUID()}.${{'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]}`;const {error}=await sb.storage.from('journal-media').upload(newPath,file,{contentType:file.type});if(error)throw error;avatar_path=newPath;}
                const {data,error}=await sb.from('couple_profiles').upsert({user_id:user.id,display_name,start_date,avatar_path},{onConflict:'user_id'}).select().single();if(error)throw error;
                committed=true;if(newPath&&profile.avatar_path)pendingAvatarCleanup.push(profile.avatar_path);profile=data;window.relationshipStart=profile.start_date;
                $('profilePicUpload').value='';await renderAvatar();await window.journal?.reload();$('profileStatus').textContent=tr('saved');
                try{await cleanupAvatars();}catch(err){retry.classList.remove('hidden');$('profileStatus').textContent=tr('cleanup_failed');}
            }catch(err){$('profileStatus').textContent=errorText(err);if(newPath&&!committed){pendingAvatarCleanup.push(newPath);try{await cleanupAvatars();}catch(cleanup){retry.classList.remove('hidden');notice(tr('cleanup_failed'),true);}}}finally{btn.disabled=false;}
        });
        async function renderAvatar(){
            if(!profile.avatar_path){$('profileAvatar').classList.add('hidden');return;}
            const {data,error}=await sb.storage.from('journal-media').createSignedUrl(profile.avatar_path,3600);if(error)throw error;$('profileAvatar').src=data.signedUrl;$('profileAvatar').classList.remove('hidden');
        }
        document.addEventListener('journal:saved',async e=>{
            if(!e.detail?.plan_id)return;const {error}=await sb.from('journal_plans').update({completed:true}).eq('id',e.detail.plan_id).eq('user_id',user.id);
            if(error){notice(tr('plan_complete_failed'),true);return;}const p=plans.find(p=>p.id===e.detail.plan_id);if(p)p.completed=true;renderPlans();
        });
        const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
        $('exportJournal').addEventListener('click',async()=>{
            const btn=$('exportJournal');btn.disabled=true;
            try{ensureUser();if(window.journal?.exportData)await window.journal.exportData({profile,plans,anniversaries:events});else download(new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),profile,plans,anniversaries:events,memories:window.journal?.getMemories()||[]},null,2)],{type:'application/json'}),`journal-${localDay()}.json`);notice(tr('export_notice'));}catch(e){notice(errorText(e),true);}finally{btn.disabled=false;}
        });
        function reviewData(){const year=String($('reviewYear').value);const memories=(window.journal?.getMemories()||[]).filter(m=>m.date.startsWith(year+'-'));return {year,memories,locations:new Set(memories.map(m=>m.location_name).filter(Boolean)).size};}
        function renderReview(){const {year,memories,locations}=reviewData();$('reviewContent').replaceChildren(node('h3',year),node('p',memories.length?`${memories.length} ${window.t?.('stat_memories')||'Memories'} · ${locations} ${window.t?.('stat_locations')||'Locations'}`:tr('no_review')));}
        $('yearReview').addEventListener('click',()=>{$('reviewYear').value=new Date().getFullYear();renderReview();$('reviewDialog').showModal();});$('reviewYear').addEventListener('input',renderReview);
        $('downloadReview').addEventListener('click',()=>{const {year,memories,locations}=reviewData();const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');const gradient=ctx.createLinearGradient(0,0,1080,1350);gradient.addColorStop(0,'#2e1f35');gradient.addColorStop(1,'#82485f');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1350);ctx.fillStyle='#ffe8ec';ctx.font='bold 90px sans-serif';ctx.fillText(year,90,260);ctx.font='44px sans-serif';ctx.fillText(tr('year_review'),90,350);ctx.font='32px sans-serif';ctx.fillText((profile.display_name||'').slice(0,30),90,450);ctx.font='bold 60px sans-serif';ctx.fillText(`${memories.length} ${window.t?.('stat_memories')||'Memories'}`,90,700);ctx.fillText(`${locations} ${window.t?.('stat_locations')||'Locations'}`,90,820);canvas.toBlob(blob=>{if(blob)download(blob,`journal-${year}.png`);},'image/png');});
        document.addEventListener('languagechange',()=>{
            for(const id of ['journalNotice','profileStatus','planStatus']) { const n=$(id); const key=Object.keys(words).find(k=>words[k].includes(n.textContent)); if(key)n.textContent=tr(key); }
            renderPlans();renderEvents();if($('reviewDialog').open)renderReview();
        });
        window.setLanguage?.(window.currentLang||'en');renderPlans();renderEvents();
        try{
            const {data,error}=await sb.auth.getUser();if(error)throw error;user=data.user;if(!user)return;
            const results=await Promise.allSettled([sb.from('couple_profiles').select('*').eq('user_id',user.id).maybeSingle(),sb.from('journal_plans').select('*').eq('user_id',user.id),sb.from('anniversaries').select('*').eq('user_id',user.id)]);
            for(let i=0;i<results.length;i++){const r=results[i];if(r.status==='rejected'||r.value.error){notice(errorText(r.reason||r.value.error),true);continue;}if(i===0){profile=r.value.data||{};$('profileName').value=profile.display_name||'';$('relationshipStart').value=profile.start_date||'';window.relationshipStart=profile.start_date;await renderAvatar();}if(i===1)plans=r.value.data||[];if(i===2)events=r.value.data||[];}
            renderPlans();renderEvents();if(profile.start_date)await window.journal?.reload();
        }catch(e){notice(errorText(e),true);}
    });
})();
