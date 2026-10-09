const translations = {
    "en": {
        "title": "💕 Dating Memories",
        "logout": "Log Out",
        "no_memories": "No memories yet 💕",
        "add_first": "Tap the + button below to add your first date memory.",
        "use_btn": "Use",
        "cancel": "Cancel",
        "map_title": "📍 Location",
        "map_sub": "Zooming into memory...",
        "save_mem": "Save Memory",
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
    "zh": {
        "title": "💕 恋爱日记",
        "logout": "登出",
        "no_memories": "还没有回忆 💕",
        "add_first": "点击下方的 + 按钮添加你们的第一次约会回忆。",
        "use_btn": "使用",
        "cancel": "取消",
        "map_title": "📍 地点",
        "map_sub": "正在放大回忆点...",
        "save_mem": "保存回忆",
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

let currentLang = localStorage.getItem('lang') || 'en';

function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update Special Nodes
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.textContent = lang === 'en' ? 'EN / 中文' : '中文 / EN';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'zh' : 'en';
            localStorage.setItem('lang', currentLang);
            applyLanguage(currentLang);
        });
    }
});
