(function(root) {
    const day = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    function parse(value) {
        if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return null;
        const [y,m,d]=value.split('-').map(Number), date=new Date(y,m-1,d,12);
        return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;
    }
    function ordinal(value) { if(!parse(value))return NaN;const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000; }
    function daysTogether(memories,start,today=day(new Date())) {
        const earliest=start&&parse(start)?start:memories.map(m=>m.date).filter(d=>parse(d)&&d<=today).sort()[0];
        return earliest?Math.max(0,ordinal(today)-ordinal(earliest)):0;
    }
    function photos(memory) {
        const refs=Array.isArray(memory.photo_urls)?memory.photo_urls.filter(p=>p&&typeof p.path==='string'&&p.bucket==='journal-media'):[];
        return [...(memory.photo_url?[{url:memory.photo_url}]:[]),...refs];
    }
    function safeURL(value) { try { const u=new URL(value,root.location?.origin||'http://localhost');return ['https:','http:','blob:'].includes(u.protocol)?u.href:''; } catch{return '';} }
    function validateMemory(data,today=day(new Date())) {
        if(!parse(data.date)||data.date>today)return 'invalid_date';
        if(!String(data.caption||'').trim()||String(data.caption).length>4000)return 'invalid_caption';
        if(!String(data.location_name||'').trim())return 'invalid_location';
        if(!String(data.mood||'').trim()||String(data.mood).length>16)return 'invalid_mood';
        return null;
    }
    function coordinates(lat,lng) {return lat!==null&&lng!==null&&lat!==''&&lng!==''&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lng))<=180;}
    function calendarCells(year,month) {
        if(!Number.isInteger(year)||!Number.isInteger(month)||month<0||month>11)return [];
        const first=new Date(Date.UTC(year,month,1)).getUTCDay();
        return Array.from({length:42},(_,index)=>{
            const date=new Date(Date.UTC(year,month,index-first+1));
            const value=`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
            return {date:value,day:date.getUTCDate(),current:date.getUTCMonth()===month};
        });
    }
    function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
    // ZIP "store" format keeps exports dependency-free and includes actual photo bytes.
    async function zip(entries) {
        const chunks=[],central=[];let offset=0,centralSize=0;
        for(const entry of entries){
            const name=new TextEncoder().encode(entry.name),bytes=new Uint8Array(await entry.blob.arrayBuffer()),crc=crc32(bytes);
            const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);header.set(name,30);
            const cd=new Uint8Array(46+name.length),c=new DataView(cd.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);cd.set(name,46);chunks.push(header,bytes);central.push(cd);centralSize+=cd.length;offset+=header.length+bytes.length;
        }
        const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);
        return new Blob([...chunks,...central,end],{type:'application/zip'});
    }
    const api={day,parse,ordinal,daysTogether,photos,safeURL,validateMemory,coordinates,calendarCells,crc32,zip};
    root.JournalUtils=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
