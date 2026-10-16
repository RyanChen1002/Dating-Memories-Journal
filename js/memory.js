/* Memory CRUD, private albums, recycle bin and maps. */
document.addEventListener('DOMContentLoaded', async () => {
    if(!document.getElementById('memoryForm'))return;
    const U=window.JournalUtils,sb=window.supabaseClient,$=id=>document.getElementById(id);
    if(!U||!sb)return;
    const words={
        loading:['Loading memories…','正在读取回忆…'],load_error:['Could not load memories. Please retry.','读取回忆失败，请重试。'],retry:['Retry','重试'],
        invalid_date:['Choose a valid date, no later than today.','请选择有效日期，不能晚于今天。'],invalid_caption:['Write a caption (up to 4000 characters).','请填写回忆内容（最多4000字）。'],invalid_location:['Enter a location.','请填写地点。'],invalid_mood:['Choose a mood (up to 16 characters).','请选择心情（最多16个字符）。'],
        choose_photo:['Choose at least one photo.','请至少选择一张照片。'],photo_limit:['Choose up to eight JPEG, PNG or WebP photos, each under 10 MB.','最多选择8张JPEG、PNG或WebP照片，每张不超过10 MB。'],
        decode_error:['This image could not be opened. Try another JPEG, PNG or WebP file.','无法读取这张图片，请换一张JPEG、PNG或WebP图片。'],saving_memory:['Saving your memory…','正在保存回忆…'],saved_memory:['Memory saved.','回忆已保存。'],
        cloud_setup:['Cloud features are not ready. Your draft is kept; please contact the site owner.','云端功能暂未就绪，草稿已保留，请联系网站维护者。'],
        no_matches:['No matching memories. Try another search or year.','没有匹配的回忆，试试其他关键词或年份。'],empty_story:['Your story starts with a first memory.','你们的故事，从第一条回忆开始。'],
        trash:['Recycle bin','回收站'],move_trash:['Move this memory to the recycle bin? You can restore it later.','将这条回忆放入回收站？之后可以恢复。'],restore:['Restore','恢复'],purge:['Delete permanently','永久删除'],
        purge_confirm:['Permanently delete this memory and its photos? This cannot be undone.','永久删除这条回忆及其照片？此操作不可撤销。'],trash_empty:['The recycle bin is empty.','回收站是空的。'],trashed:['Moved to recycle bin.','已放入回收站。'],
        cleanup_error:['Some photo cleanup failed. Retry cleanup; your saved memory is safe.','部分照片清理失败，请重试清理；已保存的回忆不受影响。'],cleanup_retry:['Retry photo cleanup','重试照片清理'],
        map_all:['Our footprints','我们的足迹'],google_map:['Google Maps','Google 地图'],map_fallback:['Google Maps is unavailable; OpenStreetMap is active.','Google 地图暂不可用，已切换到 OpenStreetMap。'],no_gps:['No saved coordinates. Edit and select a search result.','这条回忆没有坐标，请编辑并选择地点搜索结果。'],no_pins:['No locations with coordinates yet.','还没有带坐标的地点。'],
        search_error:['Location search failed. Retry or enter a name without a pin.','地点搜索失败，请重试，或只填写地点名称不保存坐标。'],
        album:['Photo album','回忆相册'],previous:['Previous','上一张'],next:['Next','下一张'],close:['Close','关闭'],remove_photo:['Remove photo','移除照片'],photo_selected:['Photos selected','已选择照片'],
        today_memory:['On this day','那年今日'],view_memory:['View memory','查看回忆'],map_unavailable:['Map unavailable. Please retry.','地图暂不可用，请重试。'],
        export_failed:['Some photos could not be downloaded; export stopped. Please retry.','部分照片下载失败，已停止导出，请重试。'],photo_error:['Photo unavailable; reload to refresh access.','照片暂不可用，请重新载入以刷新访问权限。'],
        sign_in:['Please log in again.','请重新登录。'],cancel:['Cancel','取消'],save_mem:['Save Memory','保存回忆'],update_mem:['Update Memory','更新回忆'],
        new_memory:['New Memory','新回忆'],edit_memory:['Edit Memory','编辑回忆'],btn_edit:['Edit','编辑'],btn_delete:['Recycle','放入回收站'],year_all:['All Years','全部年份'],use_btn:['Use','使用'],uploading:['Uploading photo','正在上传照片']
    };
    const t=key=>words[key]?.[window.currentLang==='zh'?1:0]||window.t?.(key)||key;
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
    const message=(text,error=false)=>{const n=$('journalNotice');n.textContent=text;n.className='app-notice'+(error?' error':'');};
    const errorText=e=>['42P01','42703','PGRST204','PGRST205'].includes(e?.code)?t('cloud_setup'):(e?.message||t('load_error'));
    const status=(text,error=false)=>{const n=$('memoryStatusMsg');n.textContent=text;n.className='status-message '+(error?'error':'info');};
    let user=null,all=[],editing=null,existing=[],files=[],lat=null,lng=null,busy=false,planId=null,schemaReady=false,selectedMood='';
    let pendingCleanup=[],photoCache=new Map(),searchSeq=0,searchTimer,searchAbort,loadSeq=0,previewURLs=[],albumItems=[],albumIndex=0;
    const modal=$('addMemoryModal'),form=$('memoryForm');
    $('memoryCaption').maxLength=4000;$('photoInput').multiple=true;$('photoInput').accept='image/jpeg,image/png,image/webp';
    const preview=el('div',null,'album-previews');$('photoPreview').after(preview);
    const progress=el('progress');progress.max=1;progress.value=0;progress.className='hidden';progress.setAttribute('aria-label',t('saving_memory'));$('memoryStatusMsg').before(progress);
    const cleanupBtn=el('button',t('cleanup_retry'),'btn-secondary hidden');cleanupBtn.type='button';$('journalNotice').after(cleanupBtn);
    function button(key,callback){const b=el('button',t(key),'btn-card-action');b.type='button';b.addEventListener('click',async()=>{if(b.disabled)return;b.disabled=true;try{await callback();}catch(e){message(errorText(e),true);}finally{b.disabled=false;}});return b;}
    const createDialog=id=>{const d=el('dialog',null,'journal-dialog');d.id=id;document.body.append(d);return d;};
    const album=createDialog('albumDialog'),trash=createDialog('trashDialog'),mapDialog=createDialog('allMapDialog');
    const mapTitle=el('h2'),mapArea=el('div');mapArea.id='journalMap';mapArea.style.height='55vh';mapDialog.append(mapTitle,mapArea,button('close',()=>mapDialog.close()));
    let googleMap=null,googleMarkers=[],googleLoader=null,leafMap=null,leafMarkers=null;
    async function signed(ref){if(ref.url)return U.safeURL(ref.url);const key=ref.bucket+'/'+ref.path;if(photoCache.has(key))return photoCache.get(key);const {data,error}=await sb.storage.from(ref.bucket).createSignedUrl(ref.path,3600);if(error)throw error;const url=U.safeURL(data.signedUrl);photoCache.set(key,url);return url;}
    async function setPhoto(img,ref){try{img.src=await signed(ref);img.onerror=()=>{img.alt=t('photo_error');};}catch(e){img.alt=t('photo_error');}}
    function download(blob,name){const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    function storageRef(ref){
        if(ref.bucket==='journal-media'&&ref.path?.startsWith(user.id+'/'))return ref;
        if(ref.url){try{const url=new URL(ref.url),project=new URL(sb.supabaseUrl||'https://gtmlpbmuhtfrsnkwejey.supabase.co');const prefix='/storage/v1/object/public/memory-photos/';if(url.origin===project.origin&&url.pathname.startsWith(prefix)){const path=decodeURIComponent(url.pathname.slice(prefix.length));if(path.startsWith(user.id+'/')||path.startsWith(user.email+'/'))return {bucket:'memory-photos',path};}}catch{}}
        return null;
    }
    function persistCleanup(){if(user)localStorage.setItem('journal_cleanup_'+user.id,JSON.stringify(pendingCleanup));}
    async function removeRefs(refs, excludingId=null){
        const {data,error}=await sb.from('memories').select('*').eq('user_id',user.id);if(error)throw error;
        const protectedKeys=new Set((data||[]).filter(m=>m.id!==excludingId).flatMap(m=>U.photos(m).map(r=>r.path||r.url)));
        for(const ref of refs){if(protectedKeys.has(ref.path||ref.url))continue;const owned=storageRef(ref);if(!owned)continue;const {error}=await sb.storage.from(owned.bucket).remove([owned.path]);if(error)throw error;}
    }
    async function cleanup(){if(!pendingCleanup.length)return;persistCleanup();try{await removeRefs(pendingCleanup);pendingCleanup=[];persistCleanup();cleanupBtn.classList.add('hidden');}catch(e){cleanupBtn.classList.remove('hidden');message(t('cleanup_error'),true);throw e;}}
    cleanupBtn.addEventListener('click',()=>cleanup().catch(()=>{}));
    function clearPreview(){previewURLs.forEach(URL.revokeObjectURL);previewURLs=[];preview.replaceChildren();$('photoPreview').classList.add('hidden');}
    function renderPreview(){
        clearPreview();
        existing.forEach((ref,index)=>{const cell=el('div'),img=el('img');img.alt=t('album');setPhoto(img,ref);cell.append(img,button('remove_photo',()=>{existing.splice(index,1);renderPreview();}));preview.append(cell);});
        files.forEach((file,index)=>{const cell=el('div'),img=el('img');img.alt=file.name;img.src=URL.createObjectURL(file);previewURLs.push(img.src);cell.append(img,button('remove_photo',()=>{files.splice(index,1);renderPreview();}));preview.append(cell);});
        $('photoDropZone').textContent=existing.length+files.length?t('photo_selected')+': '+(existing.length+files.length)+'/8':window.t?.('click_upload')||t('choose_photo');
    }
    function reset(){form.reset();editing=null;existing=[];files=[];lat=lng=null;planId=null;searchSeq++;searchAbort?.abort();$('locationSuggestions').replaceChildren();$('locationSuggestions').classList.add('hidden');$('memoryStatusMsg').className='status-message hidden';$('memoryDate').value=U.day(new Date());$('memoryDate').max=U.day(new Date());document.querySelectorAll('.mood-pill').forEach(n=>n.classList.remove('selected'));selectedMood='';renderPreview();}
    function openNew(prefill={}){
        if(busy)return;reset();$('memoryDate').value=prefill.date||U.day(new Date());$('memoryCaption').value=prefill.caption||'';$('memoryLocation').value=prefill.location_name||'';planId=prefill.plan_id||null;modal.querySelector('h2').textContent=t('new_memory');$('saveMemoryBtn').textContent=t('save_mem');modal.classList.remove('hidden');$('memoryCaption').focus();
    }
    function openEdit(memory){
        if(busy)return;reset();editing=memory;existing=U.photos(memory).slice();lat=memory.location_lat;lng=memory.location_lng;selectedMood=memory.mood;
        $('memoryDate').value=memory.date;$('memoryCaption').value=memory.caption;$('memoryLocation').value=memory.location_name;
        document.querySelectorAll('.mood-pill').forEach(p=>p.classList.toggle('selected',p.dataset.mood===selectedMood));
        modal.querySelector('h2').textContent=t('edit_memory');$('saveMemoryBtn').textContent=t('update_mem');renderPreview();modal.classList.remove('hidden');$('memoryCaption').focus();
    }
    function closeForm(){if(busy)return;modal.classList.add('hidden');reset();$('fabAdd').focus();}
    $('fabAdd').addEventListener('click',()=>openNew());$('cancelMemoryBtn').addEventListener('click',closeForm);modal.addEventListener('click',e=>{if(e.target===modal)closeForm();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))closeForm();});
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',t('new_memory'));
    modal.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...modal.querySelectorAll('button,input,textarea,[tabindex="0"]')].filter(n=>!n.disabled&&n.offsetParent!==null);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
    $('photoDropZone').tabIndex=0;$('photoDropZone').setAttribute('role','button');$('photoDropZone').addEventListener('click',()=>{if(!busy)$('photoInput').click();});$('photoDropZone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('photoDropZone').click();}});
    $('photoInput').addEventListener('change',e=>{const picked=[...e.target.files];if(existing.length+picked.length>8||picked.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){status(t('photo_limit'),true);e.target.value='';return;}files=picked;renderPreview();});
    document.querySelectorAll('.mood-pill').forEach(p=>{p.tabIndex=0;p.setAttribute('role','button');p.addEventListener('click',()=>{if(busy)return;selectedMood=p.dataset.mood;document.querySelectorAll('.mood-pill').forEach(n=>n.classList.toggle('selected',n===p));});p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();p.click();}});});
    $('addCustomMoodBtn').addEventListener('click',()=>{const value=$('customMoodInput').value.trim();if(value&&value.length<=16){selectedMood=value;document.querySelectorAll('.mood-pill').forEach(n=>n.classList.remove('selected'));$('addCustomMoodBtn').textContent=t('use_btn')+' '+value;}});
    $('memoryDate').addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});
    $('memoryLocation').addEventListener('input',()=>{
        lat=lng=null;clearTimeout(searchTimer);searchAbort?.abort();const seq=++searchSeq,query=$('memoryLocation').value.trim(),list=$('locationSuggestions');list.replaceChildren();list.classList.add('hidden');if(query.length<3)return;
        searchTimer=setTimeout(async()=>{searchAbort=new AbortController();try{const response=await fetch('https://nominatim.openstreetmap.org/search?'+new URLSearchParams({q:query,format:'json',addressdetails:'1',limit:'5','accept-language':window.currentLang==='zh'?'zh,en':'en,zh'}),{signal:searchAbort.signal});if(!response.ok)throw new Error(t('search_error'));const places=await response.json();if(seq!==searchSeq)return;list.replaceChildren();for(const place of places){const li=el('li'),b=button('invalid_location',()=>{lat=Number(place.lat);lng=Number(place.lon);$('memoryLocation').value=place.display_name||place.name||query;list.classList.add('hidden');});b.textContent=place.display_name||place.name||query;li.append(b);list.append(li);}list.classList.toggle('hidden',!places.length);}catch(e){if(e.name!=='AbortError'&&seq===searchSeq)status(t('search_error'),true);}},600);
    });
    document.addEventListener('click',e=>{if(!$('memoryLocation').contains(e.target)&&!$('locationSuggestions').contains(e.target))$('locationSuggestions').classList.add('hidden');});
    async function compress(file){
        let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw new Error(t('decode_error'));}
        try{const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));if(!blob)throw new Error(t('decode_error'));return blob;}finally{bitmap.close();}
    }
    async function checkSchema(){const {error}=await sb.from('memories').select('photo_urls,deleted_at').eq('user_id',user.id).limit(1);schemaReady=!error;if(error)throw error;}
    form.addEventListener('submit',async e=>{
        e.preventDefault();if(busy)return;
        const payload={date:$('memoryDate').value,caption:$('memoryCaption').value.trim(),location_name:$('memoryLocation').value.trim(),location_lat:lat,location_lng:lng,mood:selectedMood};
        const invalid=U.validateMemory(payload);if(invalid){status(t(invalid),true);return;}if(!existing.length&&!files.length){status(t('choose_photo'),true);return;}if(existing.length+files.length>8){status(t('photo_limit'),true);return;}
        busy=true;form.querySelectorAll('button,input,textarea').forEach(n=>n.disabled=true);status(t('saving_memory'));progress.classList.remove('hidden');progress.max=Math.max(1,files.length);progress.value=0;
        const uploaded=[];let committed=false;
        try{
            if(!user)throw new Error(t('sign_in'));if(!schemaReady)await checkSchema();
            for(const file of files){const blob=await compress(file),path=user.id+'/'+crypto.randomUUID()+'.jpg';const {error}=await sb.storage.from('journal-media').upload(path,blob,{contentType:'image/jpeg'});if(error)throw error;uploaded.push({bucket:'journal-media',path});progress.value=uploaded.length;status(t('uploading')+' '+uploaded.length+'/'+files.length);}
            const refs=[...existing,...uploaded];payload.photo_urls=refs.filter(r=>r.path);payload.photo_url=refs.find(r=>r.url)?.url||null;
            const query=editing?sb.from('memories').update(payload).eq('id',editing.id).eq('user_id',user.id):sb.from('memories').insert({...payload,user_id:user.id});
            const {data,error}=await query.select().single();if(error)throw error;committed=true;
            if(editing){const keys=new Set(refs.map(r=>r.path||r.url));pendingCleanup.push(...U.photos(editing).filter(r=>!keys.has(r.path||r.url)));}
            window.logEvent?.(editing?'memory_update':'memory_create','Memory saved');
            const savedPlan=planId;modal.classList.add('hidden');reset();message(t('saved_memory'));await reload();document.dispatchEvent(new CustomEvent('journal:saved',{detail:{memory:data,plan_id:savedPlan}}));
            try{await cleanup();}catch{}
        }catch(err){status(errorText(err),true);if(!committed){pendingCleanup.push(...uploaded);try{await cleanup();}catch{}}else message(errorText(err),true);}
        finally{busy=false;form.querySelectorAll('button,input,textarea').forEach(n=>n.disabled=false);progress.classList.add('hidden');$('saveMemoryBtn').textContent=t(editing?'update_mem':'save_mem');}
    });
    function filtered(){const term=$('searchFilter').value.toLocaleLowerCase(),year=$('yearFilter').value;return all.filter(m=>(year==='All'||m.date.slice(0,4)===year)&&[m.caption,m.location_name].some(v=>(v||'').toLocaleLowerCase().includes(term)));}
    function render(){
        const selected=$('yearFilter').value||'All';$('yearFilter').replaceChildren(new Option(t('year_all'),'All'));[...new Set(all.map(m=>m.date.slice(0,4)))].sort().reverse().forEach(y=>$('yearFilter').add(new Option(y,y)));$('yearFilter').value=[...$('yearFilter').options].some(o=>o.value===selected)?selected:'All';
        $('statMemories').textContent=all.length;$('statCities').textContent=new Set(all.map(m=>m.location_name).filter(Boolean)).size;$('statDays').textContent=U.daysTogether(all,window.relationshipStart);
        $('dashboardHeader').classList.remove('hidden');const root=$('timeline');root.replaceChildren();const list=filtered();
        if(!list.length)root.append(el('p',all.length?t('no_matches'):t('empty_story'),'empty-state'));
        for(const memory of list){
            const card=el('article',null,'memory-card');card.dataset.id=memory.id;const refs=U.photos(memory),image=el('img',null,'card-photo');image.alt=memory.caption;image.loading='lazy';if(refs[0])setPhoto(image,refs[0]);
            const photo=el('button',null,'card-photo-wrapper photo-open');photo.type='button';photo.setAttribute('aria-label',t('album'));photo.append(image);photo.addEventListener('click',()=>openAlbum(memory));card.append(photo);
            const body=el('div',null,'card-body'),date=U.parse(memory.date);
            body.append(el('div',(memory.mood||'')+' '+(date?date.toLocaleDateString(window.currentLang==='zh'?'zh-CN':'en-US',{year:'numeric',month:'short',day:'numeric'}):memory.date),'card-date'),el('p',memory.caption,'card-caption'));
            const loc=button('map_all',()=>openMap([memory]));loc.className='card-location';loc.textContent='📍 '+(memory.location_name||'');body.append(loc);
            const actions=el('div',null,'card-actions'),edit=button('btn_edit',()=>openEdit(memory)),remove=button('btn_delete',async()=>{if(!confirm(t('move_trash')))return;if(!schemaReady)await checkSchema();const {error}=await sb.from('memories').update({deleted_at:new Date().toISOString()}).eq('id',memory.id).eq('user_id',user.id);if(error)throw error;message(t('trashed'));await reload();});edit.classList.add('btn-edit');remove.classList.add('btn-delete');actions.append(edit,remove);body.append(actions);card.append(body);root.append(card);
        }
        const today=U.day(new Date()),matches=all.filter(m=>m.date.slice(5)===today.slice(5)&&m.date.slice(0,4)<today.slice(0,4)),feature=$('onThisDayFeature');feature.replaceChildren();feature.classList.toggle('hidden',!matches.length);
        if(matches.length){feature.append(el('h3',t('today_memory')));for(const m of matches){const b=button('view_memory',()=>openAlbum(m));b.textContent=m.date+' · '+m.caption;feature.append(b);}}
    }
    async function reload(){
        if(!user)return;const seq=++loadSeq;$('timeline').replaceChildren(el('p',t('loading'),'empty-state'));photoCache.clear();
        const {data,error}=await sb.from('memories').select('*').eq('user_id',user.id).order('date',{ascending:false});
        if(seq!==loadSeq)return;if(error){$('timeline').replaceChildren(el('p',errorText(error)),button('retry',reload));throw error;}
        all=(data||[]).filter(m=>!m.deleted_at);render();document.dispatchEvent(new CustomEvent('journal:loaded',{detail:{memories:all}}));
    }
    function renderAlbum(){
        album.replaceChildren(el('h2',t('album')));const stage=el('div',null,'album-stage'),img=el('img');img.alt=t('album')+' '+(albumIndex+1);if(albumItems[albumIndex])setPhoto(img,albumItems[albumIndex]);stage.append(img);album.append(stage,el('p',(albumIndex+1)+' / '+albumItems.length));
        if(albumItems.length>1){const thumbs=el('div',null,'album-thumbnails');albumItems.forEach((ref,index)=>{const pick=el('button');pick.type='button';pick.setAttribute('aria-label',`${t('album')} ${index+1}`);pick.setAttribute('aria-current',index===albumIndex?'true':'false');const thumb=el('img');thumb.alt='';setPhoto(thumb,ref);pick.append(thumb);pick.addEventListener('click',()=>{albumIndex=index;renderAlbum();});thumbs.append(pick);});album.append(thumbs);}
        const controls=el('div',null,'dialog-actions');controls.append(button('previous',()=>{albumIndex=(albumIndex-1+albumItems.length)%albumItems.length;renderAlbum();}),button('next',()=>{albumIndex=(albumIndex+1)%albumItems.length;renderAlbum();}),button('close',()=>album.close()));album.append(controls);controls.querySelector('button').focus();
    }
    function openAlbum(memory){albumItems=U.photos(memory);if(!albumItems.length)return;albumIndex=0;renderAlbum();album.showModal();}
    album.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();albumIndex=(albumIndex+(e.key==='ArrowRight'?1:-1)+albumItems.length)%albumItems.length;renderAlbum();}});
    let albumTouchX=null;album.addEventListener('touchstart',e=>{albumTouchX=e.changedTouches[0].clientX;},{passive:true});album.addEventListener('touchend',e=>{if(albumTouchX===null||albumItems.length<2)return;const delta=e.changedTouches[0].clientX-albumTouchX;albumTouchX=null;if(Math.abs(delta)>45){albumIndex=(albumIndex+(delta<0?1:-1)+albumItems.length)%albumItems.length;renderAlbum();}},{passive:true});
    async function openTrash(){
        if(!user)return;if(!schemaReady)await checkSchema();const {data,error}=await sb.from('memories').select('*').eq('user_id',user.id).not('deleted_at','is',null).order('deleted_at',{ascending:false});if(error)throw error;
        trash.replaceChildren(el('h2',t('trash')));if(!data.length)trash.append(el('p',t('trash_empty')));
        for(const memory of data){const card=el('article',null,'plan-card');card.append(el('p',memory.date+' · '+memory.caption));
            card.append(button('restore',async()=>{const {error}=await sb.from('memories').update({deleted_at:null}).eq('id',memory.id).eq('user_id',user.id);if(error)throw error;await reload();await openTrash();}));
            card.append(button('purge',async()=>{if(!confirm(t('purge_confirm')))return;await removeRefs(U.photos(memory),memory.id);const {error}=await sb.from('memories').delete().eq('id',memory.id).eq('user_id',user.id);if(error)throw error;await openTrash();}));trash.append(card);
        }trash.append(button('close',()=>trash.close()));if(!trash.open)trash.showModal();
    }
    function loadGoogleMaps(){
        if(window.google?.maps)return Promise.resolve(window.google.maps);
        if(googleLoader)return googleLoader;
        if(!window.googleMapsApiKey)return Promise.reject(new Error('Google Maps key is unavailable'));
        googleLoader=new Promise((resolve,reject)=>{
            const callback='__journalGoogleMapsReady',script=el('script');let settled=false;
            const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);delete window[callback];fn(value);};
            window[callback]=()=>finish(resolve,window.google.maps);
            const previousFailure=window.gm_authFailure;
            window.gm_authFailure=()=>{finish(reject,new Error('Google Maps authentication failed'));previousFailure?.();};
            script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(window.googleMapsApiKey)+'&loading=async&callback='+callback;
            script.async=true;script.defer=true;script.referrerPolicy='strict-origin-when-cross-origin';script.onerror=()=>finish(reject,new Error('Google Maps request failed'));document.head.append(script);
            const timer=setTimeout(()=>finish(reject,new Error('Google Maps load timed out')),12000);
        });
        return googleLoader;
    }
    function openLeaflet(valid){
        if(!window.L)throw new Error(t('map_unavailable'));
        if(!leafMap){mapArea.replaceChildren();leafMap=L.map(mapArea);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(leafMap);leafMarkers=L.featureGroup().addTo(leafMap);}
        leafMarkers.clearLayers();valid.forEach(m=>{const popup=el('div');popup.append(el('strong',m.location_name),el('p',m.caption));L.marker([Number(m.location_lat),Number(m.location_lng)]).bindPopup(popup).addTo(leafMarkers);});
        requestAnimationFrame(()=>{leafMap.invalidateSize();if(valid.length===1)leafMap.setView([Number(valid[0].location_lat),Number(valid[0].location_lng)],14);else leafMap.fitBounds(leafMarkers.getBounds(),{padding:[25,25]});});
    }
    async function openMap(memories=all){
        const valid=memories.filter(m=>U.coordinates(m.location_lat,m.location_lng));if(!valid.length){message(t(memories.length===1?'no_gps':'no_pins'),true);return;}
        mapTitle.textContent=t('map_all');if(!mapDialog.open)mapDialog.showModal();
        try{
            const maps=await loadGoogleMaps();mapTitle.textContent=t('map_all')+' · '+t('google_map');
            if(leafMap){leafMap.remove();leafMap=null;leafMarkers=null;mapArea.replaceChildren();}
            if(!googleMap)googleMap=new maps.Map(mapArea,{center:{lat:0,lng:0},zoom:2,mapTypeControl:true,streetViewControl:false,fullscreenControl:true});
            googleMarkers.forEach(marker=>marker.setMap(null));googleMarkers=[];const bounds=new maps.LatLngBounds(),info=new maps.InfoWindow();
            valid.forEach(memory=>{const position={lat:Number(memory.location_lat),lng:Number(memory.location_lng)},marker=new maps.Marker({map:googleMap,position,title:memory.location_name||memory.caption});marker.addListener('click',()=>{const popup=el('div');popup.append(el('strong',memory.location_name),el('p',memory.caption));info.setContent(popup);info.open({map:googleMap,anchor:marker});});googleMarkers.push(marker);bounds.extend(position);});
            requestAnimationFrame(()=>{maps.event.trigger(googleMap,'resize');if(valid.length===1){googleMap.setCenter(bounds.getCenter());googleMap.setZoom(14);}else googleMap.fitBounds(bounds,48);});
        }catch(error){console.warn('Google Maps unavailable; using OpenStreetMap.',error);message(t('map_fallback'));openLeaflet(valid);}
    }
    async function exportData(extra={}){
        const entries=[],memories=all.map(m=>({...m,backup_photos:[]}));
        for(const memory of memories){let index=0;for(const ref of U.photos(memory)){let blob;const storage=storageRef(ref);if(storage){const result=await sb.storage.from(storage.bucket).download(storage.path);if(result.error)throw new Error(t('export_failed'));blob=result.data;}else {const response=await fetch(await signed(ref));if(!response.ok)throw new Error(t('export_failed'));blob=await response.blob();}
            const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg',name='photos/'+memory.id+'-'+(++index)+'.'+ext;entries.push({name,blob});memory.backup_photos.push(name);}}
        entries.unshift({name:'journal.json',blob:new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),...extra,memories},null,2)],{type:'application/json'})});
        download(await U.zip(entries),'journal-'+U.day(new Date())+'.zip');
    }
    $('searchFilter').addEventListener('input',render);$('yearFilter').addEventListener('change',render);
    document.addEventListener('languagechange',()=>{render();renderPreview();$('saveMemoryBtn').textContent=t(editing?'update_mem':'save_mem');modal.querySelector('h2').textContent=t(editing?'edit_memory':'new_memory');});
    window.journal={reload,openNew,getMemories:()=>all.map(m=>({...m})),openMap,openTrash:()=>openTrash().catch(e=>message(errorText(e),true)),exportData};
    try{const {data,error}=await sb.auth.getUser();if(error)throw error;user=data.user;if(!user)return;try{pendingCleanup=JSON.parse(localStorage.getItem('journal_cleanup_'+user.id)||'[]');if(!Array.isArray(pendingCleanup))pendingCleanup=[];}catch{pendingCleanup=[];}cleanupBtn.classList.toggle('hidden',!pendingCleanup.length);try{await checkSchema();}catch(e){message(errorText(e),true);}reset();await reload();}catch(e){message(errorText(e),true);}
});
