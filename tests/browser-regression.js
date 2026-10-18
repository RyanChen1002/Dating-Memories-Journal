/* Run only on the local preview with mock-supabase.js installed through browser routing.
   Browser DOM integration tests; not a substitute for real Supabase/RLS acceptance. */
async function runJournalRegression() {
    if (!window.__qa || !['127.0.0.1','localhost'].includes(location.hostname)) throw new Error('Mock local preview required');
    const $=id=>document.getElementById(id),results=[];
    const assert=(value,message)=>{if(!value)throw new Error(message);};
    const wait=async predicate=>{for(let i=0;i<150;i++){if(predicate())return;await new Promise(r=>setTimeout(r,30));}throw new Error('Timed out waiting for UI');};
    const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new Event('input',{bubbles:true}));};
    const submit=id=>$(id).requestSubmit($(id).querySelector('button:not([type]),button[type=submit]'));
    const click=node=>node.click();
    const check=async(name,fn)=>{try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});throw Object.assign(e,{results});}};
    const originalConfirm=window.confirm,originalClick=HTMLAnchorElement.prototype.click;
    const downloads=[];window.confirm=()=>true;HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
    try {
        window.setLanguage('en');
        await wait(()=>window.journal?.getMemories().length===2);
        await check('date display / year / search / safe text',async()=>{
            assert(document.querySelector('[data-id=m1] .card-date').textContent.includes('Apr 20, 2025'),'date shifted');
            assert(document.querySelectorAll('.card-caption b').length===0,'HTML rendered');
            input('searchFilter','Kyoto');assert(document.querySelectorAll('.memory-card').length===1,'search');input('searchFilter','');
            $('yearFilter').value='2026';$('yearFilter').dispatchEvent(new Event('change'));assert(document.querySelectorAll('.memory-card').length===1,'year');$('yearFilter').value='All';$('yearFilter').dispatchEvent(new Event('change'));
        });
        await check('calendar month navigation and timeline return',async()=>{
            click($('calendarViewBtn'));assert(!$('calendarView').classList.contains('hidden'),'calendar hidden');assert($('calendarGrid').children.length===42,'calendar cells');const before=$('calendarMonthLabel').textContent;click($('calendarNext'));assert($('calendarMonthLabel').textContent!==before,'month did not change');click($('timelineViewBtn'));assert(!$('timeline').classList.contains('hidden'),'timeline hidden');
        });
        await check('new memory draft saves, restores and discards locally',async()=>{
            const key='journal_memory_draft_'+__qa.user.id;localStorage.removeItem(key);click($('fabAdd'));input('memoryCaption','Local draft');input('memoryLocation','Draft place');await wait(()=>localStorage.getItem(key));click($('cancelMemoryBtn'));click($('fabAdd'));assert(!$('memoryDraftPrompt').classList.contains('hidden'),'draft prompt');click($('restoreDraftBtn'));assert($('memoryCaption').value==='Local draft'&&$('memoryLocation').value==='Draft place','draft restore');click($('cancelMemoryBtn'));click($('fabAdd'));click($('discardDraftBtn'));assert(!localStorage.getItem(key),'draft discard');click($('cancelMemoryBtn'));
        });
        await check('profile / relationship days',async()=>{
            input('profileName','QA Couple');input('relationshipStart','2024-02-29');submit('profileForm');await wait(()=>__qa.tables.couple_profiles.length===1&&$('profileStatus').textContent.includes('Saved'));
            assert(Number($('statDays').textContent)===JournalUtils.daysTogether([],'2024-02-29'),'profile start ignored');
        });
        await check('corrupt avatar rejected without upload',async()=>{
            const transfer=new DataTransfer();transfer.items.add(new File(['invalid'],'avatar.png',{type:'image/png'}));$('profilePicUpload').files=transfer.files;const before=Object.keys(__qa.objects).length;submit('profileForm');await wait(()=>!$('profileForm').querySelector('button').disabled);assert(Object.keys(__qa.objects).length===before,'invalid avatar uploaded');assert(__qa.tables.couple_profiles[0].avatar_path===null,'avatar persisted');$('profilePicUpload').value='';submit('profileForm');await wait(()=>$('profileStatus').textContent.includes('Saved'));
        });
        await check('anniversary create and leap recurrence',async()=>{
            input('anniversaryTitle','Leap day');input('anniversaryDate','2024-02-29');submit('anniversaryForm');await wait(()=>__qa.tables.anniversaries.length===1);
            assert($('anniversaryList').textContent.includes('02-28'),'leap recurrence');
        });
        await check('plan create / budget / checklist persistence',async()=>{
            click($('addPlanBtn'));input('planTitle','QA picnic');input('planDate','2026-01-01');input('planBudget','30');input('planChecklist','Book table\nPack camera');input('planNotes','Safe <img onerror=alert(1)>');submit('planForm');await wait(()=>!$('planEditor').open);
            const checkbox=$('planList').querySelector('input');click(checkbox);await wait(()=>__qa.tables.journal_plans[0].checklist[0].done);
            assert(__qa.tables.journal_plans[0].budget===30,'budget');assert(!$('planList').querySelector('img'),'unsafe notes');
        });
        await check('checklist failed update restores latest saved state',async()=>{
            const checkbox=$('planList').querySelector('input');await wait(()=>!checkbox.disabled);__qa.fail='journal_plans';click(checkbox);await wait(()=>!checkbox.disabled);assert(checkbox.checked&&__qa.tables.journal_plans[0].checklist[0].done,'stale rollback');__qa.fail=null;
        });
        await check('failed plan save retains draft / retry',async()=>{
            click($('planList').querySelector('button'));input('planNotes','Updated notes');__qa.fail='journal_plans';submit('planForm');await wait(()=>$('planStatus').textContent.includes('failure'));
            assert($('planNotes').value==='Updated notes'&&$('planEditor').open,'draft lost');__qa.fail=null;submit('planForm');await wait(()=>!$('planEditor').open);assert(__qa.tables.journal_plans[0].notes==='Updated notes','retry failed');
        });
        await check('plan conversion fills memory without prematurely completing',async()=>{
            click($('planList').querySelectorAll('button')[1]);assert($('memoryCaption').value.includes('QA picnic'),'prefill missing');assert(!__qa.tables.journal_plans[0].completed,'premature completion');
            input('memoryLocation','QA Park');$('moodIndex').value='5';$('moodIndex').dispatchEvent(new Event('input',{bubbles:true}));
            submit('memoryForm');assert($('memoryStatusMsg').textContent.includes('photo'),'photo validation');
        });
        async function photos(corrupt=false){
            const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;canvas.getContext('2d').fillRect(0,0,32,32);const blob=await new Promise(r=>canvas.toBlob(r));const dt=new DataTransfer();
            dt.items.add(new File([corrupt?'invalid-image':blob],'one.png',{type:'image/png'}));if(!corrupt)dt.items.add(new File([blob],'two.png',{type:'image/png'}));$('photoInput').files=dt.files;$('photoInput').dispatchEvent(new Event('change',{bubbles:true}));
        }
        await check('corrupt image fails safely and re-enables form',async()=>{
            await photos(true);submit('memoryForm');await wait(()=>!$('saveMemoryBtn').disabled);assert($('memoryStatusMsg').textContent.includes('could not be opened'),'decode error missing');assert(__qa.tables.memories.length===2,'bad image saved');
        });
        await check('upload failure preserves draft and permits retry',async()=>{
            await photos();__qa.fail='upload';submit('memoryForm');await wait(()=>!$('saveMemoryBtn').disabled);assert($('memoryStatusMsg').textContent.includes('Upload failed'),'upload error missing');assert($('memoryCaption').value.includes('QA picnic'),'draft lost');__qa.fail=null;
        });
        await check('multi-photo save and plan completion',async()=>{
            submit('memoryForm');await wait(()=>__qa.tables.memories.length===3&&__qa.tables.journal_plans[0].completed&&!$('saveMemoryBtn').disabled);
            assert(__qa.tables.memories[2].photo_urls.length===2,'multi-photo missing');assert(Object.keys(__qa.objects).length===2,'uploads');
        });
        const memoryId=__qa.tables.memories[2].id;
        await check('album navigation / edit / photo removal cleanup',async()=>{
            click(document.querySelector('[data-id="'+memoryId+'"] .photo-open'));assert($('albumDialog').open,'album');click($('albumDialog').querySelectorAll('button')[1]);assert($('albumDialog').textContent.includes('2 / 2'),'next photo');$('albumDialog').close();
            click(document.querySelector('[data-id="'+memoryId+'"] .btn-edit'));input('memoryCaption','QA edited');click(document.querySelector('.album-previews button'));submit('memoryForm');await wait(()=>!$('saveMemoryBtn').disabled&&Object.keys(__qa.objects).length===1);assert(__qa.tables.memories[2].caption==='QA edited','edit');
        });
        await check('soft delete / restore preserves photo',async()=>{
            click(document.querySelector('[data-id="'+memoryId+'"] .btn-delete'));await wait(()=>journal.getMemories().length===2);await journal.openTrash();assert($('trashDialog').textContent.includes('QA edited'),'trash missing');click($('trashDialog').querySelector('article button'));await wait(()=>journal.getMemories().length===3);$('trashDialog').close();assert(Object.keys(__qa.objects).length===1,'restore photo lost');
        });
        await check('permanent delete storage failure retains row / retry succeeds',async()=>{
            click(document.querySelector('[data-id="'+memoryId+'"] .btn-delete'));await wait(()=>journal.getMemories().length===2);await journal.openTrash();__qa.fail='remove';click($('trashDialog').querySelectorAll('article button')[1]);await wait(()=>$('journalNotice').textContent.includes('Cleanup failed'));assert(__qa.tables.memories.length===3,'row removed on failure');__qa.fail=null;click($('trashDialog').querySelectorAll('article button')[1]);await wait(()=>__qa.tables.memories.length===2);assert(Object.keys(__qa.objects).length===0,'orphan photo');$('trashDialog').close();
        });
        await check('map accepts zero coordinate / safe popup text',async()=>{
            window.googleMapsApiKey='';await journal.openMap();assert($('allMapDialog').open,'map');await wait(()=>document.querySelectorAll('#journalMap .leaflet-marker-icon').length===2);document.querySelector('#journalMap .leaflet-marker-icon').click();assert(!document.querySelector('#journalMap .leaflet-popup-content b'),'unsafe popup HTML');$('allMapDialog').close();
        });
        await check('Chinese dynamic controls / drafts survive language changes',async()=>{
            journal.openNew();input('memoryCaption','Keep draft');window.setLanguage('zh');assert($('memoryCaption').value==='Keep draft','language erased draft');assert(document.querySelector('.btn-edit').textContent==='编辑','dynamic translation');$('cancelMemoryBtn').click();assert($('profileStatus').textContent==='已保存到云端。','status translation');
        });
        await check('annual review and download / backup export',async()=>{
            $('yearReview').click();input('reviewYear','2026');assert($('reviewContent').textContent.includes('1'),'review count');$('downloadReview').click();await wait(()=>downloads.some(n=>n.endsWith('.png')));$('reviewDialog').close();await journal.exportData({profile:__qa.tables.couple_profiles[0]});assert(downloads.some(n=>n.endsWith('.zip')),'backup download');
        });
        await check('anniversary and plan deletion',async()=>{
            click($('anniversaryList').querySelector('button'));click($('planList').querySelectorAll('button')[2]);await wait(()=>__qa.tables.anniversaries.length===0&&__qa.tables.journal_plans.length===0);
        });
        await check('timeline backend failure / recovery',async()=>{
            __qa.fail='memories';try{await journal.reload();}catch{}assert($('timeline').textContent.includes('failure'),'load error');__qa.fail=null;await journal.reload();assert(journal.getMemories().length===2,'load recovery');
        });
        return {results,downloads,remainingMemories:__qa.tables.memories.length,remainingPhotos:Object.keys(__qa.objects).length};
    } catch(e) { return {results,error:e.message}; }
    finally {window.confirm=originalConfirm;HTMLAnchorElement.prototype.click=originalClick;__qa.fail=null;}
}
