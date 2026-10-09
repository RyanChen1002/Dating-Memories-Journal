// Internationalization (i18n) Engine
// Supports English (en) and Chinese (zh) seamlessly.

const translations = {
    "en": {
        "title": "💕 Dating Memories",
        "logout": "Log Out",
        "stat_memories": "Memories",
        "stat_locations": "Locations",
        "stat_days": "Days Together",
        "search_ph": "Search memories...",
        "year_all": "All Years",
        "no_memories": "No memories yet 💕",
        "add_first": "Tap the + button below to add your first date memory.",
        "new_memory": "New Memory ✨",
        "edit_memory": "Edit Memory ✏️",
        "subtitle": "Capture the moment",
        "date_photo": "Date Photo",
        "click_upload": "Click to upload a photo",
        "keep_photo": "Keep current photo",
        "date_of_mem": "Date of Memory",
        "date_hint": "Click the calendar icon or type directly (YYYY-MM-DD)",
        "caption": "Caption",
        "caption_ph": "What made this moment special?",
        "location_name": "Location Name",
        "location_ph": "e.g. Millennium Park, Chicago",
        "mood": "Mood",
        "custom_mood_ph": "Or paste any emoji here...",
        "use_btn": "Use",
        "cancel": "Cancel",
        "save_mem": "Save Memory",
        "update_mem": "Update Memory",
        "map_title": "📍 Location",
        "map_sub": "Zooming into memory...",
        "close_map": "Close Map",
        "auth_title": "💕 Dating Journal",
        "auth_sub": "Your private timeline together.",
        "hero_sub": "Chronicle your shared love story on the cloud.",
        "feat_cloud": "☁️ Cloud Secured",
        "feat_pins": "📍 Map Pins",
        "feat_sync": "📱 Live Sync",
        "email": "Email Address",
        "email_ph": "youremail@example.com",
        "password": "Password",
        "password_ph": "Minimum 6 characters",
        "begin_sync": "Begin Sync",
        "btn_edit": "Edit",
        "btn_delete": "Delete",
        "confirm_delete": "Are you sure you want to permanently delete this beautiful memory?",
        
        // New Components below
        "our_profile": "Our Profile 👩‍❤️‍👨",
        "upload_photo": "Upload Photo",
        "custom_timers": "Custom Timers ⏳",
        "first_date": "Since First Date (Count Up)",
        "next_anniv": "Next Anniversary (Countdown)",
        "upcoming_plans": "Upcoming Plans ✨",
        "japan_trip": "Japan Trip",
        "bucket_list": "Bucket List",
        "pasta_place": "Try New Pasta Place",
        "date_idea": "Date Idea",
        "add_plan": "+ Add New Plan",
        "premium_3d": "✨ Premium 3D Atmospheres",
        "premium_sub": "Immersive daytime and sunset 3D physics engines.",
        "dusky_waves": "🌊 Dusky Silk Waves",
        "twi_clouds": "☁️ Twilight Clouds",
        "birds_dusk": "🦅 Birds at Dusk",
        "starry_night": "🌌 Starry Night",
        "siamese_cats": "🐈 Siamese Cats",
        "falling_sakura": "🌸 Falling Sakura"
    },
    // 中文翻译
    "zh": {
        "title": "💕 恋爱日记",
        "logout": "登出",
        "stat_memories": "美好回忆",
        "stat_locations": "打卡地点",
        "stat_days": "相爱天数",
        "search_ph": "搜索回忆...",
        "year_all": "所有年份",
        "no_memories": "还没有回忆 💕",
        "add_first": "点击下方 + 按钮添加你们的第一个约会记忆。",
        "new_memory": "新回忆 ✨",
        "edit_memory": "编辑回忆 ✏️",
        "subtitle": "记录美好瞬间",
        "date_photo": "约会照片",
        "click_upload": "点击上传照片",
        "keep_photo": "保留当前照片",
        "date_of_mem": "回忆日期",
        "date_hint": "点击日历图标或直接输入 (YYYY-MM-DD)",
        "caption": "文案",
        "caption_ph": "这个瞬间为什么特别？",
        "location_name": "地点名称",
        "location_ph": "例如：外滩, 上海",
        "mood": "心情",
        "custom_mood_ph": "或者在这里粘贴任何表情...",
        "use_btn": "使用",
        "cancel": "取消",
        "save_mem": "保存回忆",
        "update_mem": "更新回忆",
        "map_title": "📍 地点",
        "map_sub": "正在放大回忆坐标...",
        "close_map": "关闭地图",
        "auth_title": "💕 恋爱日记",
        "auth_sub": "你们的私密爱情时光轴。",
        "hero_sub": "在云端记录你们的专属爱情故事。",
        "feat_cloud": "☁️ 云端加密存储",
        "feat_pins": "📍 GPS 地图打卡",
        "feat_sync": "📱 实时多端同步",
        "email": "邮箱地址",
        "email_ph": "youremail@example.com",
        "password": "密码",
        "password_ph": "至少 6 个字符",
        "begin_sync": "开始同步",
        "btn_edit": "编辑",
        "btn_delete": "删除",
        "confirm_delete": "你确定要永久删除这段美丽的回忆吗？",
        
        // New Components below
        "our_profile": "我们的档案 👩‍❤️‍👨",
        "upload_photo": "上传照片",
        "custom_timers": "专属计时器 ⏳",
        "first_date": "从初次约会开始 (正数)",
        "next_anniv": "下一个纪念日 (倒数)",
        "upcoming_plans": "未来计划 ✨",
        "japan_trip": "日本之旅",
        "bucket_list": "愿望清单",
        "pasta_place": "尝试新意面餐厅",
        "date_idea": "约会点子",
        "add_plan": "+ 添加新计划",
        "premium_3d": "✨ 尊享 3D 氛围",
        "premium_sub": "沉浸式日间和日落 3D 物理引擎。",
        "dusky_waves": "🌊 暮色丝绸海浪",
        "twi_clouds": "☁️ 暮光晚霞",
        "birds_dusk": "🦅 黄昏飞鸟",
        "starry_night": "🌌 星空之夜",
        "siamese_cats": "🐈 暹罗猫",
        "falling_sakura": "🌸 飘落樱花"
    }
};

window.currentLang = localStorage.getItem('i18n_lang') || 'en';

window.setLanguage = function(lang) {
    if (!translations[lang]) return;
    window.currentLang = lang;
    localStorage.setItem('i18n_lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            // Check if input/textarea placeholder or text node
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder) {
                    el.placeholder = translations[lang][key];
                }
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    // Update Toggle Button UI (NO EMOJI PER USER REQUEST)
    const toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) {
        toggleBtn.textContent = lang === 'en' ? 'EN / 中文' : '中文 / EN';
    }

    // Retranslate dynamically injected timelines if needed
    if (typeof window.applyTranslationsToTimeline === 'function') {
        window.applyTranslationsToTimeline();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Run initial translation
    window.setLanguage(window.currentLang);
    
    // Attach listener to toggle button
    const toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) {
        // Clear any hardcoded unicode strings so dynamic rendering aligns properly
        toggleBtn.textContent = window.currentLang === 'en' ? 'EN / 中文' : '中文 / EN';
        
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop any form execution natively
            const nextLang = window.currentLang === 'en' ? 'zh' : 'en';
            window.setLanguage(nextLang);
        });
    }
});
