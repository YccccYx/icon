export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // ==========================================
    // 🌐 智能域名识别机制
    // ==========================================
    let hostUrl = url.origin;
    if (env.CUSTOM_DOMAIN) {
      hostUrl = env.CUSTOM_DOMAIN.trim().replace(/\/$/, '');
      if (!hostUrl.startsWith('http')) hostUrl = 'https://' + hostUrl;
    }

    // ==========================================
    // 🔗 一键自动激活 Webhook (告别手动拼链接)
    // ==========================================
    if (request.method === 'GET' && path === '/api/init') {
        let resultText = "🤖 【Telegram Webhook 激活结果】\n\n";
        
        // 1. 激活管理员机器人
        if (env.TG_BOT_TOKEN) {
            const adminWebhook = `${hostUrl}/webhook/tg/${env.TG_BOT_TOKEN}`;
            try {
                const res = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(adminWebhook)}`);
                const data = await res.json();
                resultText += `🛡️ 管理员机器人:\n🔗 绑定地址: ${adminWebhook}\n✅ 状态: ${data.description}\n\n`;
            } catch (e) {
                resultText += `🛡️ 管理员机器人:\n❌ 请求失败: ${e.message}\n\n`;
            }
        } else {
            resultText += `🛡️ 管理员机器人: ⚠️ 未在环境变量配置 TG_BOT_TOKEN\n\n`;
        }
        
        // 2. 激活游客机器人
        if (env.GUEST_TG_BOT_TOKEN) {
            const guestWebhook = `${hostUrl}/webhook/tg_guest/${env.GUEST_TG_BOT_TOKEN}`;
            try {
                const res = await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(guestWebhook)}`);
                const data = await res.json();
                resultText += `🌍 游客区机器人:\n🔗 绑定地址: ${guestWebhook}\n✅ 状态: ${data.description}\n\n`;
            } catch (e) {
                resultText += `🌍 游客区机器人:\n❌ 请求失败: ${e.message}\n\n`;
            }
        } else {
            resultText += `🌍 游客区机器人: ⚠️ 未在环境变量配置 GUEST_TG_BOT_TOKEN\n\n`;
        }

        return new Response(resultText, { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
    }

    // ==========================================
    // 🛠️ 辅助函数：文件大小精准计算 & KV 解析
    // ==========================================
    function formatSize(bytes) {
        if (!bytes) return '未知';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function parseKvValue(rawValue) {
        if (!rawValue) return { url: null, msgId: null, chatId: null, size: '未知' };
        try { const parsed = JSON.parse(rawValue); return { url: parsed.url, msgId: parsed.msgId, chatId: parsed.chatId, size: parsed.size || '未知' }; } 
        catch (e) { return { url: rawValue, msgId: null, chatId: null, size: '未知' }; }
    }

    // ==========================================
    // 🎨 共享前端 CSS & 主题切换组件
    // ==========================================
    const sharedCSS = `
      <style>
        * { box-sizing: border-box; }
        
        body, html { 
            margin: 0; padding: 0; min-height: 100vh; 
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            background-color: #050608; 
            background-image: radial-gradient(circle at 15% 20%, rgba(82, 181, 75, 0.12) 0%, transparent 50%), 
                              radial-gradient(circle at 85% 80%, rgba(0, 242, 254, 0.12) 0%, transparent 50%), 
                              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg stroke='rgba(255,255,255,0.035)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='30' cy='30' r='12'/%3E%3Cpolygon points='28,25 28,35 36,30'/%3E%3Crect x='80' y='20' width='18' height='24' rx='2'/%3E%3Cpath d='M80 26h18M80 32h18M80 38h18M84 20v24M94 20v24'/%3E%3Crect x='25' y='80' width='22' height='16' rx='2'/%3E%3Cpath d='M31 80l5-5l5 5M31 96h10'/%3E%3Ccircle cx='88' cy='88' r='12'/%3E%3Ccircle cx='88' cy='88' r='4'/%3E%3C/g%3E%3C/svg%3E"); 
            background-attachment: fixed; 
            color: #e0e6ed; 
            transition: background-color 0.4s ease, color 0.4s ease;
        }
        
        .page-wrapper { padding: 5vh 20px; width: 100%; max-width: 1400px; margin: 0 auto; position: relative; }
        .panel { background: rgba(15, 18, 25, 0.7); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(0, 242, 254, 0.15); border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(0,242,254,0.05); transition: all 0.4s ease; }
        
        .login-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 400px; padding: 40px 30px; text-align: center; z-index: 50; margin: 0; }
        .dashboard-panel { width: 100%; padding: 30px; margin: 0 auto; }

        h1 { margin: 0 0 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; background: linear-gradient(135deg, #fff, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; border: 1px solid; }
        .badge.guest { border-color: rgba(255,255,255,0.3); color: #aaa; background: rgba(255,255,255,0.05); }
        .badge.admin { border-color: rgba(0,242,254,0.5); color: #00f2fe; background: rgba(0,242,254,0.05); }
        
        .input-group { position: relative; margin-bottom: 15px; width: 100%; }
        .input-group input { width: 100%; padding: 15px 20px; background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 30px; color: white; font-size: 14px; outline: none; transition: all 0.3s; box-sizing: border-box; }
        .input-group input:focus { border-color: #00f2fe; background: rgba(0,242,254,0.05); box-shadow: 0 0 15px rgba(0,242,254,0.2); }
        
        .file-upload-label { display: block; width: 100%; padding: 15px 20px; background: rgba(255,255,255,0.03); border: 1.5px dashed rgba(255,255,255,0.2); border-radius: 30px; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; text-align: left; transition: all 0.3s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 20px; box-sizing: border-box;}
        .file-upload-label:hover { background: rgba(0,242,254,0.05); border-color: #00f2fe; color: white; }
        
        .submit-btn { display: flex; justify-content: center; align-items: center; width: 100%; padding: 15px; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #050608; border: none; border-radius: 30px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; text-align: center; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,242,254,0.4); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .submit-btn.gallery-btn { background: linear-gradient(135deg, #0052d4 0%, #4364f7 100%); box-shadow: 0 5px 15px rgba(67, 100, 247, 0.3); color: #fff;}
        .submit-btn.gallery-btn:hover:not(:disabled) { background: linear-gradient(135deg, #4364f7 0%, #6fb1fc 100%); box-shadow: 0 8px 25px rgba(67, 100, 247, 0.6); }
        
        .submit-btn.danger { display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); box-shadow: none; padding: 6px 12px; font-size: 12px; color: white; border-radius: 20px; width: auto; text-align: center; }
        .submit-btn.danger:hover:not(:disabled) { box-shadow: 0 5px 15px rgba(255,65,108,0.4); }
        .submit-btn.outline { display: inline-flex; justify-content: center; align-items: center; background: transparent; border: 1px solid #00f2fe; color: #00f2fe; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: normal; width: auto; margin: 0; text-align: center; }
        .submit-btn.outline:hover:not(:disabled) { background: rgba(0,242,254,0.1); box-shadow: 0 0 10px rgba(0,242,254,0.3); }
        
        .nav-links { margin-top: 20px; font-size: 13px; text-align: center; width: 100%; }
        .nav-links a { color: #00f2fe; text-decoration: none; margin: 0 10px; transition: 0.3s; }
        
        .dashboard-layout { display: flex; flex-direction: row; gap: 30px; align-items: flex-start; width: 100%; }
        .admin-sidebar { width: 320px; flex-shrink: 0; background: rgba(0,0,0,0.3); padding: 25px; border-radius: 16px; box-sizing: border-box; }
        .admin-main { flex: 1; min-width: 0; }
        
        .category-tabs { display: flex; gap: 10px; overflow-x: auto; margin-bottom: 15px; padding-bottom: 5px; scrollbar-width: none; }
        .category-tabs::-webkit-scrollbar { display: none; }
        .tab-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #aaa; padding: 6px 16px; border-radius: 20px; cursor: pointer; white-space: nowrap; font-size: 13px; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; }
        .tab-btn.active { background: rgba(0,242,254,0.1); border-color: #00f2fe; color: #00f2fe; font-weight: bold; }
        .cat-tag { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px; font-size: 11px; color: #00f2fe; white-space: nowrap; }

        .table-container { width: 100%; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; box-sizing: border-box; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; min-width: 600px; }
        th, td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
        th { color: #00f2fe; font-weight: normal; white-space: nowrap; }
        
        .name-box { display: flex; flex-direction: column; line-height: 1.5; align-items: flex-start; text-align: left; }
        
        .action-btns { display: flex; gap: 6px; flex-wrap: nowrap; align-items: center; }
        .checkbox-custom { width: 16px; height: 16px; cursor: pointer; accent-color: #00f2fe; margin: 0; vertical-align: middle;}
        
        .icon-preview { width: 35px; height: 35px; border-radius: 8px; object-fit: cover; vertical-align: middle; background: rgba(255,255,255,0.05); cursor: zoom-in; border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s; }
        .icon-preview:hover { transform: scale(1.1); border-color: #00f2fe; }

        .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 100; align-items: center; justify-content: center; }
        .modal-content { background: #12151e; border: 1px solid #00f2fe; border-radius: 20px; padding: 25px; width: 90%; max-width: 420px; text-align: left; }
        .copy-box { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .copy-box input { background: transparent; border: none; color: #fff; flex: 1; min-width: 0; outline: none; font-family: monospace; font-size: 12px;}
        .copy-btn { background: rgba(0,242,254,0.2); color: #00f2fe; border: 1px solid #00f2fe; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.2s; white-space: nowrap; display: inline-flex; justify-content: center; align-items: center; }
        
        .image-viewer { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); z-index: 999; align-items: center; justify-content: center; cursor: zoom-out; }
        .image-viewer img { max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 12px; box-shadow: 0 0 30px rgba(0, 242, 254, 0.3); border: 2px solid rgba(255,255,255,0.1); animation: zoomIn 0.3s ease; }
        @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* ==========================================
           🌞 亮暗模式切换支持
           ========================================== */
        .theme-toggle { position: fixed; top: 25px; right: 25px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; width: 42px; height: 42px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 1000; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: all 0.3s ease; }
        .theme-toggle:hover { background: rgba(0, 242, 254, 0.2); border-color: #00f2fe; transform: scale(1.1); }
        
        body.light-mode {
            background-color: #f0f4f8;
            background-image: radial-gradient(circle at 15% 20%, rgba(0, 153, 255, 0.06) 0%, transparent 50%), 
                              radial-gradient(circle at 85% 80%, rgba(0, 242, 254, 0.1) 0%, transparent 50%), 
                              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg stroke='rgba(0,102,255,0.05)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='30' cy='30' r='12'/%3E%3Cpolygon points='28,25 28,35 36,30'/%3E%3Crect x='80' y='20' width='18' height='24' rx='2'/%3E%3Cpath d='M80 26h18M80 32h18M80 38h18M84 20v24M94 20v24'/%3E%3Crect x='25' y='80' width='22' height='16' rx='2'/%3E%3Cpath d='M31 80l5-5l5 5M31 96h10'/%3E%3Ccircle cx='88' cy='88' r='12'/%3E%3Ccircle cx='88' cy='88' r='4'/%3E%3C/g%3E%3C/svg%3E");
            color: #1e293b;
        }
        body.light-mode .theme-toggle { background: rgba(255,255,255,0.6); border-color: rgba(0, 153, 255, 0.2); color: #0077ff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        body.light-mode .theme-toggle:hover { background: #fff; border-color: #0077ff; box-shadow: 0 6px 20px rgba(0, 119, 255, 0.2); }
        body.light-mode .panel { background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(0, 153, 255, 0.2); box-shadow: 0 25px 50px rgba(0, 30, 80, 0.08), 0 0 40px rgba(0, 153, 255, 0.08); }
        body.light-mode h1 { background: linear-gradient(135deg, #0f172a, #0077ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        body.light-mode .badge.guest { border-color: rgba(0,0,0,0.2); color: #64748b; background: rgba(0,0,0,0.05); }
        body.light-mode .badge.admin { border-color: rgba(0, 119, 255, 0.3); color: #0077ff; background: rgba(0, 119, 255, 0.1); }
        body.light-mode .input-group input { background: #fff; border-color: rgba(0, 119, 255, 0.2); color: #1e293b; }
        body.light-mode .input-group input:focus { border-color: #0077ff; background: #fff; box-shadow: 0 0 15px rgba(0, 119, 255, 0.15); }
        body.light-mode .file-upload-label { background: #fff; border-color: rgba(0, 119, 255, 0.2); color: #64748b; }
        body.light-mode .file-upload-label:hover { background: rgba(0, 119, 255, 0.05); border-color: #0077ff; color: #0077ff; }
        body.light-mode .submit-btn.outline { border-color: #0077ff; color: #0077ff; }
        body.light-mode .submit-btn.outline:hover:not(:disabled) { background: rgba(0, 119, 255, 0.1); box-shadow: 0 0 10px rgba(0, 119, 255, 0.2); }
        body.light-mode .submit-btn.outline[style*="color: white"] { border-color: #0077ff !important; color: #0077ff !important; }
        body.light-mode .nav-links a { color: #0077ff; }
        body.light-mode .table-container { background: rgba(255, 255, 255, 0.6); }
        body.light-mode th { color: #0077ff; border-bottom-color: rgba(0,0,0,0.1); }
        body.light-mode td { border-bottom-color: rgba(0,0,0,0.05); }
        body.light-mode .name-box code { color: #1e293b !important; font-weight: 500;}
        body.light-mode .name-box span { color: #0077ff !important; }
        body.light-mode .admin-sidebar { background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0, 153, 255, 0.15); }
        body.light-mode .admin-sidebar h3, body.light-mode .admin-main h3 { color: #0077ff !important; }
        body.light-mode .tab-btn { background: #fff; border-color: rgba(0, 119, 255, 0.2); color: #64748b; }
        body.light-mode .tab-btn.active { background: rgba(0, 119, 255, 0.1); border-color: #0077ff; color: #0077ff; }
        body.light-mode .cat-tag { background: rgba(0, 119, 255, 0.1); color: #0077ff; }
        body.light-mode .copy-box { background: #fff; border-color: rgba(0, 119, 255, 0.2); }
        body.light-mode .copy-box input { color: #1e293b; }
        body.light-mode .modal-content { background: #f0f4f8; border-color: rgba(0, 119, 255, 0.3); }
        body.light-mode #modalTitle { color: #0077ff !important; }
        body.light-mode .modal-content label { color: #0077ff !important; }
        body.light-mode .modal-content .submit-btn[style*="color:white"] { background: rgba(0, 119, 255, 0.1) !important; color: #0077ff !important; border: 1px solid rgba(0, 119, 255, 0.2); box-shadow: none; }
        body.light-mode .modal-content .submit-btn[style*="color:white"]:hover { background: rgba(0, 119, 255, 0.2) !important; }
        body.light-mode .icon-preview { background: #fff; border-color: rgba(0,0,0,0.1); }
        body.light-mode .icon-preview:hover { border-color: #0077ff; }
        body.light-mode .col-role span { color: #64748b !important; }
        body.light-mode .col-role span[style*="00f2fe"] { color: #0077ff !important; font-weight: bold; }
        body.light-mode .image-viewer { background: rgba(255,255,255,0.85); }
        body.light-mode .image-viewer img { box-shadow: 0 0 40px rgba(0, 119, 255, 0.2); border-color: rgba(0, 153, 255, 0.2); }
        
        /* ==========================================
           📱 移动端自适应 (重点修改了顶部边距)
           ========================================== */
        @media (max-width: 900px) {
            .page-wrapper { padding: 70px 10px 20px; display: block; } 
            
            .login-panel { width: 90%; padding: 30px 20px; margin: 0; }
            .dashboard-panel { padding: 15px 10px; border-radius: 16px; margin-top: 0; }
            
            .dashboard-layout { flex-direction: column; gap: 15px; }
            .admin-sidebar { width: 100%; padding: 15px; }
            .admin-main { width: 100%; }
            
            .table-container { padding: 5px; background: rgba(0,0,0,0.2); overflow-x: auto; border-radius: 8px;}
            table { width: 100%; table-layout: fixed; min-width: 340px; } 
            th, td { padding: 8px 4px; font-size: 11px; vertical-align: middle; word-wrap: break-word; }
            
            th.col-cb, td.col-cb { width: 24px; text-align: center; padding: 0; } 
            th.col-preview, td.col-preview { width: 38px; text-align: center; } 
            
            th.col-cat, td.col-cat { width: 48px; text-align: center; padding: 0 2px; } 
            th.col-role, td.col-role { width: 48px; text-align: center; padding: 0 2px; } 
            
            th.col-name, td.col-name { width: auto; text-align: center; } 
            .name-box { align-items: center; justify-content: center; text-align: center; width: 100%; margin: 0 auto; }
            
            th.col-actions, td.col-actions { width: 56px; text-align: center; } 
            
            .icon-preview { width: 28px; height: 28px; margin: 0 auto; display: block; border-radius: 6px; }
            
            .action-btns { display: flex; flex-direction: column; gap: 5px; align-items: stretch; }
            .action-btns button { padding: 6px 0; font-size: 11px; margin: 0; display: flex; justify-content: center; align-items: center; width: 100%; border-radius: 6px; white-space: nowrap; } 
            .checkbox-custom { width: 15px; height: 15px; margin: 0; }
            
            .copy-box { flex-direction: column; align-items: stretch; gap: 8px; }
            .copy-box input { width: 100%; }
            .copy-btn { width: 100%; padding: 10px; }
            
            .theme-toggle { top: 15px; right: 15px; width: 36px; height: 36px; }
        }
      </style>
    `;

    const themeToggleHTML = `
      <button class="theme-toggle" id="themeToggleBtn" onclick="toggleTheme()" title="切换亮/暗模式">
          <svg id="themeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>
      </button>
    `;

    const themeToggleJS = `
      <script>
          const themeIcon = document.getElementById('themeIcon');
          const sunSvg = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
          const moonSvg = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
          function initTheme() {
              if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-mode'); themeIcon.innerHTML = moonSvg; } 
              else { themeIcon.innerHTML = sunSvg; }
          }
          function toggleTheme() {
              document.body.classList.toggle('light-mode');
              const isLight = document.body.classList.contains('light-mode');
              localStorage.setItem('theme', isLight ? 'light' : 'dark');
              themeIcon.innerHTML = isLight ? moonSvg : sunSvg;
          }
          initTheme();
      </script>
    `;

    // ==========================================
    // 🌐 路由 1：游客上传页 (完全阉割批量)
    // ==========================================
    if (request.method === 'GET' && path === '/') {
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>专用图标上传</title>${sharedCSS}</head><body>
          ${themeToggleHTML}
          <div class="page-wrapper">
              <div class="panel login-panel">
                  <h1>Icon Upload</h1>
                  <div class="badge guest">专用单图上传节点</div>
                  <form id="uploadForm">
                      <div class="input-group">
                          <input type="text" name="icon_name" id="guestIconName" required placeholder="图标名称 (必填)" autocomplete="off">
                      </div>
                      <div class="input-group">
                          <input type="password" name="password" required placeholder="游客访问密码">
                      </div>
                      <label for="file-upload" class="file-upload-label" id="file-name-display">选择单张图片</label>
                      <input id="file-upload" type="file" name="file" accept="image/*" required style="display:none;">
                      <button type="submit" class="submit-btn" id="submitBtn">上传至游客区</button>
                  </form>
                  <button class="submit-btn gallery-btn" style="margin-top:20px; opacity:0.9;" onclick="location.href='/gallery'">游客图库 (上传后可查看)</button>
                  <div class="nav-links"><a href="/admin">⚙️ 管理员入口</a></div>
              </div>
          </div>

          <div class="modal" id="successModal"><div class="modal-content"><h3 style="margin-top:0; color:#00f2fe; font-size:18px;" id="modalTitle">✅ 上传成功！</h3><label style="font-size:12px;color:#00f2fe;display:block;margin-bottom:5px;">🔗 游客 JSON 订阅地址:</label><div class="copy-box"><input type="text" id="jsonLink" readonly><button class="copy-btn" onclick="copyText('jsonLink')">复制</button></div><label style="font-size:12px;color:#00f2fe;display:block;margin-bottom:5px;">🖼️ 图片直链:</label><div class="copy-box" id="imgBoxWrap"><input type="text" id="imgLink" readonly><button class="copy-btn" id="imgCopyBtn" onclick="copyText('imgLink')">复制</button></div><button class="submit-btn" style="margin-top:5px;background:rgba(255,255,255,0.1);color:white;padding:10px;" onclick="document.getElementById('successModal').style.display='none'">关闭</button></div></div>
          
          <script>
              const fileInput = document.getElementById('file-upload');
              const display = document.getElementById('file-name-display');
              const iconNameInput = document.getElementById('guestIconName');
              
              fileInput.addEventListener('change', e => {
                  if(e.target.files.length > 0) { 
                      display.textContent = e.target.files[0].name; 
                      iconNameInput.placeholder = "图标名称 (如 wechat)";
                      display.style.borderColor = '#00f2fe';
                  } else { 
                      display.textContent = '选择单张图片'; 
                      display.style.borderColor = 'rgba(255,255,255,0.2)';
                  }
              });
              
              document.getElementById('uploadForm').addEventListener('submit', async e => {
                  e.preventDefault(); const files = fileInput.files; if(!files.length) return;
                  const btn = document.getElementById('submitBtn'); btn.disabled = true;
                  btn.textContent = '上传中...';
                  
                  try {
                      const fd = new FormData(); 
                      fd.append('password', e.target.password.value); 
                      fd.append('file', files[0]);
                      
                      let iName = iconNameInput.value.trim(); 
                      if(!iName) iName = files[0].name.replace(/\\.[^/.]+$/, ""); 
                      fd.append('icon_name', iName);
                      
                      const res = await fetch('/api/upload?role=guest', { method: 'POST', body: fd }); 
                      if(res.ok) { 
                          const data = await res.json(); 
                          document.getElementById('modalTitle').innerText = '✅ 上传成功！';
                          document.getElementById('jsonLink').value = data.jsonUrl; 
                          document.getElementById('imgLink').value = data.imgUrl;
                          document.getElementById('imgCopyBtn').style.display = 'block'; 
                          document.getElementById('successModal').style.display = 'flex';
                      } else { 
                          alert('❌ 上传失败，请检查密码或网络'); 
                      }
                  } catch (err) { alert('网络错误: ' + err.message); } 
                  finally {
                      e.target.reset(); display.textContent = '选择单张图片'; 
                      iconNameInput.placeholder = "图标名称 (必填)"; 
                      btn.textContent = '上传至游客区'; btn.disabled = false; 
                      display.style.borderColor = 'rgba(255,255,255,0.2)';
                  }
              });
              function copyText(id) { document.getElementById(id).select(); document.execCommand('copy'); alert('复制成功！'); }
          </script>
          ${themeToggleJS}
      </body></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // ==========================================
    // 🖼️ 路由：游客图库
    // ==========================================
    if (request.method === 'GET' && path === '/gallery') {
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>游客图库</title>${sharedCSS}</head><body>
          ${themeToggleHTML}
          <div class="page-wrapper">
              <div class="panel login-panel" id="loginBox">
                  <h1>Guest Gallery</h1>
                  <div class="input-group"><input type="password" id="guestPwd" placeholder="请输入游客访问密码" onkeydown="if(event.key==='Enter') login()"></div>
                  <button class="submit-btn gallery-btn" onclick="login()">进入图库</button>
                  <div class="nav-links"><a href="/">返回首页</a></div>
              </div>
              <div class="panel dashboard-panel" id="galleryBox" style="display:none;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                      <h1 style="margin: 0; font-size: 22px;">游客专属图库</h1>
                      <div style="display:flex; gap:10px;"><a href="${hostUrl}/guest.json" target="_blank" class="submit-btn outline" style="text-decoration:none; border-color:#4a90e2; color:#4a90e2; line-height:16px;">📄 查看 JSON</a><button class="submit-btn outline" style="width: auto; margin: 0; border-color: rgba(255,255,255,0.3); color: white;" onclick="logout()">退出图库</button></div>
                  </div>
                  <div class="table-container">
                      <table>
                          <thead><tr><th class="col-preview">预览</th><th class="col-name">名称 / 大小</th><th class="col-actions">操作</th></tr></thead>
                          <tbody id="galleryListBody"><tr><td colspan="3" style="text-align:center;">加载中...</td></tr></tbody>
                      </table>
                  </div>
              </div>
          </div>
          <div class="image-viewer" id="imageViewer" onclick="closeImageViewer()"><img id="viewerImage" src="" alt="大图预览"></div>
          <script>
              let pwd = sessionStorage.getItem('guestPwd') || ''; if(pwd) login(pwd);
              async function login(savedPwd) {
                  const btn = document.querySelector('#loginBox .submit-btn');
                  let inputPwd = document.getElementById('guestPwd').value;
                  if (typeof savedPwd === 'string' && savedPwd) inputPwd = savedPwd;
                  if (!inputPwd) return;

                  const origText = btn.innerText;
                  btn.innerText = '登录中...'; btn.disabled = true;

                  try {
                      const res = await fetch('/api/guest/list', { headers: { 'Authorization': inputPwd } });
                      if(res.ok) { 
                          sessionStorage.setItem('guestPwd', inputPwd); pwd = inputPwd; 
                          document.getElementById('loginBox').style.display = 'none'; 
                          document.getElementById('galleryBox').style.display = 'block'; 
                          renderList(await res.json()); 
                      } else { 
                          if(typeof savedPwd !== 'string') alert('访问密码错误'); 
                          sessionStorage.removeItem('guestPwd'); 
                      }
                  } catch(e) { alert('网络连接异常'); } 
                  finally { btn.innerText = origText; btn.disabled = false; }
              }
              function logout() { sessionStorage.removeItem('guestPwd'); pwd = ''; document.getElementById('galleryBox').style.display = 'none'; document.getElementById('loginBox').style.display = 'block'; document.getElementById('guestPwd').value = ''; }
              
              function renderList(data) {
                  const tbody = document.getElementById('galleryListBody'); tbody.innerHTML = '';
                  if(data.length === 0) return tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">图库空空如也</td></tr>';
                  data.forEach(item => { 
                      const tr = document.createElement('tr'); 
                      tr.innerHTML = \`
                          <td class="col-preview"><img src="\${item.url}" class="icon-preview" onclick="viewImage('\${item.url}')" loading="lazy"></td>
                          <td class="col-name">
                              <div class="name-box">
                                  <code style="color:#e0e6ed; font-size:13px; word-break: break-all;">\${item.name}</code>
                                  <span style="font-size:11px; color:#00f2fe; margin-top:2px;">\${item.size || '未知'}</span>
                              </div>
                          </td>
                          <td class="col-actions"><div class="action-btns"><button class="submit-btn outline" onclick="copyLink('\${item.url}')">复制</button></div></td>\`; 
                      tbody.appendChild(tr); 
                  });
              }
              function viewImage(url) { document.getElementById('viewerImage').src = url; document.getElementById('imageViewer').style.display = 'flex'; }
              function closeImageViewer() { document.getElementById('imageViewer').style.display = 'none'; document.getElementById('viewerImage').src = ''; }
              function copyLink(text) { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => alert('已复制直链！')).catch(() => fallbackCopy(text)); else fallbackCopy(text); }
              function fallbackCopy(text) { const input = document.createElement('input'); input.value = text; document.body.appendChild(input); input.select(); try{ document.execCommand('copy'); alert('已复制直链！'); }catch(e){} document.body.removeChild(input); }
          </script>
          ${themeToggleJS}
      </body></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // ==========================================
    // 🛡️ 路由 3：管理员面板
    // ==========================================
    if (request.method === 'GET' && path === '/admin') {
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>管理员控制台</title>${sharedCSS}</head><body>
          ${themeToggleHTML}
          <div class="page-wrapper">
              <div class="panel login-panel" id="loginBox">
                  <h1>Admin Login</h1>
                  <div class="input-group"><input type="password" id="adminPwd" placeholder="请输入超级密码" onkeydown="if(event.key==='Enter') login()"></div>
                  <button class="submit-btn" onclick="login()">登入控制台</button>
                  <div class="nav-links"><a href="/">返回游客首页</a></div>
              </div>

              <div class="panel dashboard-panel" id="dashboard" style="display:none;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                      <div style="text-align: left;">
                          <h1 style="margin: 0;">Admin Panel</h1>
                          <div class="badge admin" style="margin: 5px 0 0 0;">超级权限已验证</div>
                      </div>
                      <button class="submit-btn outline" style="border-color: rgba(255,255,255,0.3); color: white;" onclick="logout()">退出登入</button>
                  </div>
                  
                  <div class="dashboard-layout">
                      <div class="admin-sidebar">
                          <h3 style="margin-top:0; margin-bottom:15px; color:#00f2fe; font-size:16px;">⚡ 管理员直传</h3>
                          <form id="adminUploadForm">
                              <div class="input-group">
                                  <input type="text" name="icon_name" id="adminIconName" required placeholder="图标名称 (单图必填)" autocomplete="off">
                              </div>
                              <div class="input-group">
                                  <input type="text" name="category" placeholder="分类合集 (跟随Tab自动锁定)" autocomplete="off">
                              </div>
                              <label for="admin-file-upload" class="file-upload-label" id="admin-file-name-display">选择图片 (支持批量上传)</label>
                              <input id="admin-file-upload" type="file" name="files" accept="image/*" multiple required style="display:none;">
                              <button type="submit" class="submit-btn" id="adminSubmitBtn">上传至管理区</button>
                          </form>
                      </div>
                      
                      <div class="admin-main">
                          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                              <h3 style="margin:0; color:#00f2fe; font-size:16px;">🗂️ 图标数据库管理</h3>
                              <div style="display:flex; gap:10px;">
                                  <button class="submit-btn danger" id="batchDelBtn" onclick="batchDelete()" style="display:none; padding: 6px 15px;">批量删除</button>
                                  <button id="refreshBtn" onclick="loadList()" class="submit-btn outline">刷新列表</button>
                              </div>
                          </div>

                          <div class="copy-box" style="margin-bottom: 15px;">
                              <input type="text" id="adminJsonLink" readonly value="${hostUrl}/admin.json">
                              <button class="copy-btn" onclick="copyText('adminJsonLink')">复制合集订阅</button>
                          </div>

                          <div class="category-tabs" id="adminCategoryTabs" style="display:none;"></div>

                          <div class="table-container">
                              <table>
                                  <thead>
                                      <tr>
                                          <th class="col-cb"><input type="checkbox" id="selectAll" class="checkbox-custom" onchange="toggleAll(this)"></th>
                                          <th class="col-preview">预览</th>
                                          <th class="col-cat">合集</th>
                                          <th class="col-name">名称 / 大小</th>
                                          <th class="col-role">归属</th>
                                          <th class="col-actions">操作</th>
                                      </tr>
                                  </thead>
                                  <tbody id="iconListBody"><tr><td colspan="6" style="text-align:center;">加载中...</td></tr></tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div class="image-viewer" id="imageViewer" onclick="closeImageViewer()"><img id="viewerImage" src="" alt="大图预览"></div>

          <script>
              let pwd = sessionStorage.getItem('adminPwd') || ''; let allAdminData =[]; let currentCat = '全部';
              if(pwd) login(pwd);

              async function login(savedPwd) {
                  const btn = document.querySelector('#loginBox .submit-btn');
                  let inputPwd = document.getElementById('adminPwd').value;
                  if (typeof savedPwd === 'string' && savedPwd) inputPwd = savedPwd;
                  if (!inputPwd) return;

                  const origText = btn.innerText;
                  btn.innerText = '登录中...'; btn.disabled = true;

                  try {
                      const res = await fetch('/api/admin/list', { headers: { 'Authorization': inputPwd } });
                      if(res.ok) { 
                          sessionStorage.setItem('adminPwd', inputPwd); pwd = inputPwd; 
                          document.getElementById('loginBox').style.display = 'none'; 
                          document.getElementById('dashboard').style.display = 'block'; 
                          allAdminData = await res.json(); renderTabs(); renderTable(); 
                      } else { 
                          if(typeof savedPwd !== 'string') alert('超级密码错误'); 
                          sessionStorage.removeItem('adminPwd'); 
                      }
                  } catch(e) { alert('网络不通畅，请稍后重试'); }
                  finally { btn.innerText = origText; btn.disabled = false; }
              }

              function logout() { sessionStorage.removeItem('adminPwd'); pwd = ''; document.getElementById('dashboard').style.display = 'none'; document.getElementById('loginBox').style.display = 'block'; document.getElementById('adminPwd').value = ''; }

              async function loadList() {
                  const btn = document.getElementById('refreshBtn');
                  if (btn) { btn.innerText = '刷新中...'; btn.disabled = true; }
                  try {
                      const res = await fetch('/api/admin/list', { headers: { 'Authorization': pwd } });
                      if(res.ok) { allAdminData = await res.json(); renderTabs(); renderTable(); } 
                      else if(res.status === 401) { alert('认证失效'); logout(); }
                  } finally {
                      if (btn) { btn.innerText = '刷新列表'; btn.disabled = false; }
                  }
              }

              function renderTabs() {
                  const tabsDiv = document.getElementById('adminCategoryTabs');
                  let rawCategories =[...new Set(allAdminData.map(item => item.category))]; let filteredCategories = rawCategories.filter(c => c !== '管理区');
                  const categories =['全部', ...filteredCategories];
                  if (categories.length <= 1) { tabsDiv.style.display = 'none'; tabsDiv.innerHTML = ''; } else { tabsDiv.style.display = 'flex'; tabsDiv.innerHTML = categories.map(c => \`<button class="tab-btn \${currentCat === c ? 'active' : ''}" onclick="switchCat('\${c}')">\${c}</button>\`).join(''); }
              }

              function switchCat(cat) {
                  currentCat = cat; renderTabs(); renderTable();
                  const linkInput = document.getElementById('adminJsonLink'); const catInput = document.querySelector('input[name="category"]');
                  if(cat === '全部') { linkInput.value = '${hostUrl}/admin.json'; if(catInput) catInput.value = ''; } else { linkInput.value = '${hostUrl}/admin/' + encodeURIComponent(cat) + '.json'; if(catInput) catInput.value = cat; }
              }

              function renderTable() {
                  const tbody = document.getElementById('iconListBody'); const filtered = currentCat === '全部' ? allAdminData : allAdminData.filter(i => i.category === currentCat);
                  if(filtered.length === 0) { document.getElementById('selectAll').checked = false; document.getElementById('batchDelBtn').style.display = 'none'; return tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">数据库空空如也</td></tr>'; }
                  
                  tbody.innerHTML = filtered.map(item => {
                      const roleTag = item.role === 'admin' ? '<span style="color:#00f2fe;font-weight:bold;">Admin</span>' : '<span style="color:#aaa">Guest</span>';
                      const catDisplay = item.category === '管理区' ? '<span style="color:#555;">-</span>' : \`<span class="cat-tag">\${item.category}</span>\`;
                      
                      return \`<tr>
                          <td class="col-cb"><input type="checkbox" class="item-checkbox checkbox-custom" value="\${item.key}" onchange="checkSelection()"></td>
                          <td class="col-preview"><img src="\${item.url}" class="icon-preview" loading="lazy" onclick="viewImage('\${item.url}')"></td>
                          <td class="col-cat">\${catDisplay}</td>
                          <td class="col-name">
                              <div class="name-box">
                                  <code style="color:#e0e6ed; font-size:13px; word-break: break-all;">\${item.name}</code>
                                  <span style="font-size:11px; color:#00f2fe; margin-top:2px;">\${item.size || '未知'}</span>
                              </div>
                          </td>
                          <td class="col-role">\${roleTag}</td>
                          <td class="col-actions">
                              <div class="action-btns"><button class="submit-btn outline" onclick="copyLink('\${item.url}')">复制</button><button class="submit-btn danger" onclick="deleteIcon('\${item.key}', this)">删除</button></div>
                          </td>
                      </tr>\`;
                  }).join(''); checkSelection(); 
              }

              function toggleAll(source) { document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = source.checked); checkSelection(); }
              function checkSelection() {
                  const checkboxes = document.querySelectorAll('.item-checkbox'); const checked = document.querySelectorAll('.item-checkbox:checked'); const selectAll = document.getElementById('selectAll'); const batchDelBtn = document.getElementById('batchDelBtn');
                  if(checkboxes.length > 0 && checked.length === checkboxes.length) selectAll.checked = true; else selectAll.checked = false;
                  if(checked.length > 0) { batchDelBtn.style.display = 'inline-flex'; batchDelBtn.innerText = \`批量删除 (\${checked.length})\`; } else { batchDelBtn.style.display = 'none'; }
              }

              async function batchDelete() {
                  const checked = document.querySelectorAll('.item-checkbox:checked'); if(checked.length === 0) return;
                  if(!confirm(\`确定要彻底删除这 \${checked.length} 个图标吗？\n(如果关联了TG群通知，也会同步撤回)\`)) return;
                  
                  const btn = document.getElementById('batchDelBtn'); btn.disabled = true; btn.innerText = '删除中...';
                  const keys = Array.from(checked).map(cb => cb.value);
                  try {
                      const res = await fetch('/api/admin/delete', { method: 'POST', headers: { 'Authorization': pwd, 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: keys }) });
                      if(res.ok) { 
                          checked.forEach(cb => { const tr = cb.closest('tr'); if(tr) tr.remove(); });
                          allAdminData = allAdminData.filter(i => !keys.includes(i.key));
                          btn.style.display = 'none'; document.getElementById('selectAll').checked = false;
                      } else { 
                          alert('❌ 批量删除失败'); btn.disabled = false; btn.innerText = \`批量删除 (\${checked.length})\`; 
                      }
                  } catch(e) { alert('网络异常'); btn.disabled = false; btn.innerText = \`批量删除 (\${checked.length})\`; }
              }

              async function deleteIcon(key, btnElement) {
                  if(!confirm('确定彻底删除该图标吗？')) return; 
                  const origText = btnElement.innerText;
                  btnElement.disabled = true; btnElement.innerText = '中...';
                  try {
                      const res = await fetch('/api/admin/delete', { method: 'POST', headers: { 'Authorization': pwd, 'Content-Type': 'application/json' }, body: JSON.stringify({ keys:[key] }) });
                      if(res.ok) { 
                          const tr = btnElement.closest('tr'); if(tr) tr.remove();
                          allAdminData = allAdminData.filter(i => i.key !== key);
                          checkSelection();
                      } else { 
                          alert('❌ 删除失败'); btnElement.disabled = false; btnElement.innerText = origText; 
                      }
                  } catch(e) { alert('网络异常'); btnElement.disabled = false; btnElement.innerText = origText; }
              }

              function viewImage(url) { document.getElementById('viewerImage').src = url; document.getElementById('imageViewer').style.display = 'flex'; }
              function closeImageViewer() { document.getElementById('imageViewer').style.display = 'none'; document.getElementById('viewerImage').src = ''; }
              function copyText(id) { document.getElementById(id).select(); document.execCommand('copy'); alert('专属合集订阅复制成功！'); }
              function copyLink(text) { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => alert('已复制直链！')).catch(() => fallbackCopy(text)); else fallbackCopy(text); }
              function fallbackCopy(text) { const input = document.createElement('input'); input.value = text; document.body.appendChild(input); input.select(); try{ document.execCommand('copy'); alert('已复制直链！'); }catch(e){} document.body.removeChild(input); }

              const adminFileInput = document.getElementById('admin-file-upload'); const adminDisplay = document.getElementById('admin-file-name-display'); const adminIconNameInput = document.getElementById('adminIconName');

              adminFileInput.addEventListener('change', e => {
                  const count = e.target.files.length;
                  if(count === 1) { adminDisplay.textContent = e.target.files[0].name; adminIconNameInput.disabled = false; adminIconNameInput.required = true; adminIconNameInput.placeholder = "图标名称 (如 emby)"; }
                  else if (count > 1) { adminDisplay.textContent = \`已选择 \${count} 个文件 (批量上传)\`; adminIconNameInput.disabled = true; adminIconNameInput.required = false; adminIconNameInput.value = ''; adminIconNameInput.placeholder = "批量上传将自动使用原文件名"; }
                  else { adminDisplay.textContent = '选择图片 (支持批量上传)'; adminIconNameInput.disabled = false; adminIconNameInput.required = true; }
                  adminDisplay.style.borderColor = count > 0 ? '#00f2fe' : 'rgba(255,255,255,0.2)';
              });

              document.getElementById('adminUploadForm').addEventListener('submit', async e => {
                  e.preventDefault(); const files = adminFileInput.files; if(!files.length) return;
                  const btn = document.getElementById('adminSubmitBtn'); btn.disabled = true;
                  
                  try {
                      const targetCategory = e.target.category.value.trim();
                      let successCount = 0, failCount = 0; let errorMsg = '';
                      
                      for(let i=0; i<files.length; i++) {
                          btn.textContent = \`上传中... (\${i+1}/\${files.length})\`;
                          const fd = new FormData(); fd.append('password', pwd); fd.append('category', targetCategory); fd.append('file', files[i]);
                          
                          let iName = adminIconNameInput.value.trim(); 
                          if(files.length > 1 || !iName) { iName = files[i].name.replace(/\\.[^/.]+$/, ""); } 
                          fd.append('icon_name', iName);
                          
                          const res = await fetch('/api/upload?role=admin', { method: 'POST', body: fd }); 
                          if(res.ok) { successCount++; } else { failCount++; const err = await res.json(); errorMsg = err.error || '未知错误'; }
                          if(i < files.length - 1) await new Promise(r => setTimeout(r, 300));
                      }
                      
                      if(failCount > 0) alert(\`⚠️ 上传完成 \n成功: \${successCount} \n失败: \${failCount} \n原因: \${errorMsg}\`);
                      else alert(files.length > 1 ? \`✅ 批量上传完成！共 \${successCount} 个\` : '✅ 上传成功！');
                      
                      e.target.reset(); 
                      adminDisplay.textContent = '选择图片 (支持批量上传)'; 
                      adminIconNameInput.disabled = false; adminIconNameInput.required = true; adminIconNameInput.placeholder = "图标名称 (如 emby)";
                      
                      if (currentCat !== '全部') { document.querySelector('input[name="category"]').value = currentCat; }
                      await loadList(); 
                  } catch(err) { alert('网络异常或脚本报错：' + err.message); } 
                  finally { btn.textContent = '上传至管理区'; btn.disabled = false; adminDisplay.style.borderColor = 'rgba(255,255,255,0.2)'; }
              });
          </script>
          ${themeToggleJS}
      </body></html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // ==========================================
    // 📡 接口：JSON 订阅解析
    // ==========================================
    if (request.method === 'GET') {
      let isGuest = false; let isAdmin = false; let reqCategory = null;
      if (path === '/guest.json') { isGuest = true; } 
      else if (path === '/admin.json') { isAdmin = true; } 
      else if (path.startsWith('/admin/') && path.endsWith('.json')) { isAdmin = true; reqCategory = decodeURIComponent(path.slice(7, -5)); }

      if (isGuest || isAdmin) {
          const prefix = isGuest ? 'guest:' : 'admin:'; let libName = isGuest ? '专用共享图标库' : '我的专属图标库 (Admin)';
          if (reqCategory && !isGuest) libName += ` - ${reqCategory}合集`;
          try {
            let iconArray =[]; let listComplete = false; let cursor = undefined;
            while (!listComplete) {
                const list = await env.ICON_KV.list({ prefix: prefix, cursor: cursor });
                const chunkResults = await Promise.all(list.keys.map(async keyObj => {
                    const parts = keyObj.name.split(':'); const itemCategory = parts.length >= 3 ? parts[1] : '管理区'; const cleanName = parts.length >= 3 ? parts.slice(2).join(':') : parts[1];
                    if (!isGuest && reqCategory && itemCategory !== reqCategory) return null;
                    const rawValue = await env.ICON_KV.get(keyObj.name); const { url } = parseKvValue(rawValue);
                    if (url) return { "name": cleanName, "url": url };
                    return null;
                }));
                iconArray.push(...chunkResults.filter(Boolean));
                listComplete = list.list_complete; cursor = list.cursor;
            }
            return new Response(JSON.stringify({ "name": libName, "description": "基于 Cloudflare Workers 自建的图标分类分发库", "icons": iconArray }, null, 2), { headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } });
          } catch (e) { return new Response('{"error":"读取数据失败"}', { status: 500, headers: {'Content-Type': 'application/json;charset=UTF-8'} }); }
      }
    }

    if (request.method === 'GET' && path === '/api/guest/list') {
      if (request.headers.get('Authorization') !== env.GUEST_PASSWORD) return new Response('Unauthorized', { status: 401 });
      let result =[]; let listComplete = false; let cursor = undefined;
      while (!listComplete) {
          const list = await env.ICON_KV.list({ prefix: 'guest:', cursor: cursor });
          const chunkResults = await Promise.all(list.keys.map(async keyObj => {
              const rawValue = await env.ICON_KV.get(keyObj.name); const { url, size } = parseKvValue(rawValue); 
              if(url) { const parts = keyObj.name.split(':'); return { key: keyObj.name, name: parts[parts.length - 1], url: url, size: size }; }
              return null;
          }));
          result.push(...chunkResults.filter(Boolean));
          listComplete = list.list_complete; cursor = list.cursor;
      }
      return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }});
    }

    if (request.method === 'GET' && path === '/api/admin/list') {
      if (request.headers.get('Authorization') !== env.ADMIN_PASSWORD) return new Response('Unauthorized', { status: 401 });
      let result =[]; let listComplete = false; let cursor = undefined;
      while (!listComplete) {
          const list = await env.ICON_KV.list({ cursor: cursor });
          const chunkResults = await Promise.all(list.keys.map(async keyObj => {
              const rawValue = await env.ICON_KV.get(keyObj.name); const { url, size } = parseKvValue(rawValue);
              if(url) {
                  const parts = keyObj.name.split(':'); const role = parts[0]; const category = parts.length >= 3 ? parts[1] : '管理区'; const cleanName = parts.length >= 3 ? parts.slice(2).join(':') : parts[1];
                  return { key: keyObj.name, name: cleanName, category: category, role: role, url: url, size: size };
              }
              return null;
          }));
          result.push(...chunkResults.filter(Boolean));
          listComplete = list.list_complete; cursor = list.cursor;
      }
      result.sort((a, b) => a.role.localeCompare(b.role)); return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }});
    }

    // ==========================================
    // 📤 接口：处理网页端单次上传
    // ==========================================
    if (request.method === 'POST' && path === '/api/upload') {
      const role = url.searchParams.get('role') || 'guest'; const formData = await request.formData();
      const password = formData.get('password'); const iconName = formData.get('icon_name'); let category = formData.get('category') || '';
      const file = formData.get('file');

      if (role === 'guest') category = '';
      if (role === 'guest' && password !== env.GUEST_PASSWORD) return Response.json({ error: '游客密码错误' }, { status: 403 });
      if (role === 'admin' && password !== env.ADMIN_PASSWORD) return Response.json({ error: '管理员密码错误' }, { status: 403 });
      if (!file || !iconName) return Response.json({ error: '缺少图片文件或名称' }, { status: 400 });

      const sizeStr = formatSize(file.size);
      category = category.trim().replace(/[:/]/g, ''); const kvKey = category ? `${role}:${category}:${iconName}` : `${role}:${iconName}`;
      const fileExt = file.name.split('.').pop() || 'png'; const r2Path = `${role}/${iconName}_${Date.now()}.${fileExt}`;
      await env.ICON_R2.put(r2Path, file); const publicUrl = `${hostUrl}/${r2Path}`;
      
      let tgMsgId = null; let tgChatId = null; const primaryTargetId = env.ADMIN_CHAT_ID ? String(env.ADMIN_CHAT_ID).split(',')[0].trim() : null;
      try {
        //[网页端上传] -> 都会推送到群里
        if (primaryTargetId && env.TG_BOT_TOKEN) {
            const tgRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  chat_id: primaryTargetId, text: `🔔 <b>网页端上传 [${role === 'admin' ? '🛡️管理后台' : '🌍游客区'}]</b>\n名称: <code>${iconName}</code>${role === 'admin' && category ? `\n合集: <code>${category}</code>` : ''}\n📦 大小: <code>${sizeStr}</code>\n链接: ${publicUrl}`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🗑️ 彻底删除", callback_data: `del_kv:${kvKey}` }]] }
              })
            });
            if (tgRes.ok) { const tgData = await tgRes.json(); tgMsgId = tgData.result.message_id; tgChatId = tgData.result.chat.id; }
        }
      } catch (e) {}

      await env.ICON_KV.put(kvKey, JSON.stringify({ url: publicUrl, msgId: tgMsgId, chatId: tgChatId, size: sizeStr }));
      const finalJsonUrl = (role === 'admin' && category) ? `${hostUrl}/admin/${encodeURIComponent(category)}.json` : `${hostUrl}/${role}.json`;
      return Response.json({ success: true, iconName: iconName, imgUrl: publicUrl, jsonUrl: finalJsonUrl });
    }

    if (request.method === 'POST' && path === '/api/admin/delete') {
      if (request.headers.get('Authorization') !== env.ADMIN_PASSWORD) return new Response('Unauthorized', { status: 401 });
      const body = await request.json(); const keys = body.keys || (body.key ?[body.key] :[]);
      for (const key of keys) {
          const rawValue = await env.ICON_KV.get(key);
          if (rawValue) {
            const { url, msgId, chatId } = parseKvValue(rawValue);
            if (url) { 
                const urlObj = new URL(url); 
                const r2Path = decodeURIComponent(urlObj.pathname.substring(1)); 
                await env.ICON_R2.delete(r2Path); 
            }
            await env.ICON_KV.delete(key);
            if (msgId && chatId) { fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/deleteMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, message_id: msgId }) }).catch(() => {}); }
          }
      }
      return new Response('Deleted', { status: 200 });
    }

    // ==========================================
    // 🤖 TG 管理员 Bot 引擎 (原机器人)
    // ==========================================
    if (env.TG_BOT_TOKEN && request.method === 'POST' && path === `/webhook/tg/${env.TG_BOT_TOKEN}`) {
      const update = await request.json();
      const allowedAdminIds = env.ADMIN_CHAT_ID ? String(env.ADMIN_CHAT_ID).split(',').map(s => s.trim()) :[];

      const menuText = `👋 <b>欢迎使用专属图标管理机器人！</b>

===========================
📥 <b>【如何批量/单张上传？】</b>
1️⃣ <b>先设置存放的目录 (直接发送对应消息)：</b>
• 发送 <code>/admin</code> : 切换到【管理区】(默认)
• 发送 <code>/你的合集名</code> : 切换到指定合集 (如 <code>/test</code> 或 <code>/影视</code>，会自动创建)
• 发送 <code>/guest</code> : 切换到【游客区】

2️⃣ <b>设置好后，直接发送图片即可全自动入库！</b>
👉 <b>单张发图：</b>默认生成随机名 (也可在"添加说明/Caption"填自定义名)
👉 <b>批量入库 (🔥 强烈推荐)：</b>发送时选择<b>“作为文件 / Document”</b>，会自动剥离扩展名并使用原文件名入库！

<i>💡 隐藏技巧：发送图片时，如果在说明(Caption)直接填 <code>/合集名</code>，可实现单次越级存放，不改变全局状态！</i>
===========================

🌐 <b>网页管理控制台：</b>
${hostUrl}/admin

🔗 <b>总库订阅链接：</b>
• 游客订阅： ${hostUrl}/guest.json
• 管理订阅： ${hostUrl}/admin.json

👇 <b>下面的按键仅用于【查询或删除】已上传的记录：</b>`;

      const menuMarkup = {
          inline_keyboard: [[{ text: "📊 查询当前总统计", callback_data: "stats" }, { text: "🗂️ 浏览与删除图标库", callback_data: "list_cats" }]]
      };

      if (update.callback_query) {
        const cb = update.callback_query; const data = cb.data; const chatRoomId = String(cb.message.chat.id); const userId = String(cb.from.id);
        
        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: cb.id }) }).catch(()=>{});

        if (allowedAdminIds.length > 0 && !allowedAdminIds.includes(chatRoomId) && !allowedAdminIds.includes(userId)) return new Response('OK');

        if (data === 'stats') {
            let adminCount = 0, guestCount = 0; let catCounts = {}; let listComplete = false; let cursor = undefined;
            while (!listComplete) {
                const list = await env.ICON_KV.list(cursor ? { cursor } : {});
                await Promise.all(list.keys.map(async keyObj => {
                    const rawValue = await env.ICON_KV.get(keyObj.name); const { url } = parseKvValue(rawValue);
                    if (url) {
                        const parts = keyObj.name.split(':'); const role = parts[0];
                        if (role === 'admin') { 
                            adminCount++; 
                            const cat = (parts.length >= 3 && keyObj.name.indexOf(':', 6) !== -1 && !keyObj.name.startsWith('admin::')) ? parts[1] : '管理区'; 
                            catCounts[cat] = (catCounts[cat] || 0) + 1; 
                        } else if (role === 'guest') { guestCount++; }
                    }
                }));
                listComplete = list.list_complete; cursor = list.cursor;
            }
            
            let catText = ""; const sortedCats = Object.keys(catCounts).sort();
            for (const cat of sortedCats) { catText += `├ <code>${cat}</code> : ${catCounts[cat]} 个\n`; }
            
            const statsText = `📊 <b>后台数据库实时统计</b>\n\n🛡️ <b>Admin 核心图标库</b> (共 <code>${adminCount}</code> 个)\n${catText}\n🌍 <b>Guest 游客上传库</b> (共 <code>${guestCount}</code> 个)\n\n📦 <b>全库总计收录：</b> <code>${adminCount + guestCount}</code> 个\n\n<i>数据已同步至最新。</i>`;
            
            await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, message_id: cb.message.message_id, text: statsText, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🔙 返回主菜单", callback_data: "menu" }]] }}) });
            return new Response('OK');
        }

        if (data === 'menu') {
            await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, message_id: cb.message.message_id, text: menuText, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: menuMarkup }) });
            return new Response('OK');
        }

        if (data === 'list_cats') {
            let cats = new Set(); let listComplete = false; let cursor = undefined;
            while (!listComplete) {
                const list = await env.ICON_KV.list({ cursor: cursor });
                for (const keyObj of list.keys) {
                    const parts = keyObj.name.split(':');
                    if (parts[0] === 'admin') { cats.add(parts.length >= 3 ? parts[1] : '管理区'); } 
                    else if (parts[0] === 'guest') { cats.add('游客区'); }
                }
                listComplete = list.list_complete; cursor = list.cursor;
            }
            
            let kb =[]; let temp =[]; const sortedCats = Array.from(cats).sort();
            for (let c of sortedCats) { temp.push({ text: `📁 ${c}`, callback_data: `show_cat:${c}` }); if (temp.length === 2) { kb.push(temp); temp =[]; } }
            if (temp.length > 0) kb.push(temp); kb.push([{ text: "🔙 返回主菜单", callback_data: "menu" }]);
            
            await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, message_id: cb.message.message_id, text: "🗂️ <b>请点击你需要管理的合集目录：</b>", parse_mode: 'HTML', reply_markup: { inline_keyboard: kb } }) });
            return new Response('OK');
        }

        if (data.startsWith('show_cat:')) {
            const targetCat = data.replace('show_cat:', ''); let icons =[]; let listComplete = false; let cursor = undefined;
            while (!listComplete) {
                const list = await env.ICON_KV.list({ cursor: cursor });
                for (const keyObj of list.keys) {
                    const parts = keyObj.name.split(':'); const role = parts[0];
                    const cat = (role === 'guest') ? '游客区' : (parts.length >= 3 ? parts[1] : '管理区');
                    const name = (role === 'guest') ? parts[1] : (parts.length >= 3 ? parts.slice(2).join(':') : parts[1]);
                    if (cat === targetCat) { icons.push({ key: keyObj.name, name: name }); }
                }
                listComplete = list.list_complete; cursor = list.cursor;
            }
            
            let kb =[]; let temp =[]; const displayIcons = icons.slice(0, 90);
            for (let icon of displayIcons) {
                let cbData = `del_kv:${icon.key}`; if (new Blob([cbData]).size > 64) continue; 
                temp.push({ text: `❌ 删 ${icon.name}`, callback_data: cbData }); if (temp.length === 2) { kb.push(temp); temp =[]; }
            }
            if (temp.length > 0) kb.push(temp);
            if (icons.length > 90) { kb.push([{ text: `⚠️ 仅显示前90个，余下请使用网页端管理`, callback_data: "ignore" }]); }
            kb.push([{ text: "🔙 返回目录列表", callback_data: "list_cats" }]);
            
            await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, message_id: cb.message.message_id, text: `🗂️ <b>[${targetCat}]</b> 的图标列表：\n<i>💡 轻轻点击下方任一按钮，该图标就会从云端瞬间删除！</i>`, parse_mode: 'HTML', reply_markup: { inline_keyboard: kb } }) });
            return new Response('OK');
        }

        if (data.startsWith('del_kv:')) {
          const kvKey = data.replace('del_kv:', '');
          const currentKb = cb.message.reply_markup ? cb.message.reply_markup.inline_keyboard :[];
          const newKb = currentKb.map(row => row.filter(btn => btn.callback_data !== data)).filter(row => row.length > 0);
          const msgText = cb.message.text || '';
          
          ctx.waitUntil((async () => {
              if (msgText.includes('网页端上传') || msgText.includes('入库成功') || msgText.includes('机器人上传')) {
                  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: cb.message.chat.id, message_id: cb.message.message_id, text: `🗑️ 图标[${kvKey.split(':').pop()}] 已从数据库中彻底抹除。` }) });
              } else {
                  if (newKb.length === 1 && newKb[0][0].callback_data === 'list_cats') {
                       await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: cb.message.chat.id, message_id: cb.message.message_id, text: `✅ 该目录下的图标已被你全部删光了。`, reply_markup: { inline_keyboard: newKb } }) });
                  } else {
                      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/editMessageReplyMarkup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: cb.message.chat.id, message_id: cb.message.message_id, reply_markup: { inline_keyboard: newKb } }) });
                  }
              }

              const rawValue = await env.ICON_KV.get(kvKey);
              if (rawValue) {
                  const { url, msgId, chatId } = parseKvValue(rawValue);
                  if (url) { const urlObj = new URL(url); const r2Path = decodeURIComponent(urlObj.pathname.substring(1)); await env.ICON_R2.delete(r2Path); }
                  await env.ICON_KV.delete(kvKey);
                  if (msgId && chatId) { fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/deleteMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, message_id: msgId }) }).catch(() => {}); }
              }
          })());
          return new Response('OK');
        }
      }

      if (update.message) {
        const chatRoomId = String(update.message.chat.id); const userId = String(update.message.from.id);
        if (allowedAdminIds.length > 0 && !allowedAdminIds.includes(chatRoomId) && !allowedAdminIds.includes(userId)) return new Response('OK');
        const msgText = update.message.text || '';

        if (msgText === '/start' || msgText === '/help') {
           await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: menuText, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: menuMarkup }) });
           return new Response('OK');
        }

        if (msgText.startsWith('/')) {
            const targetRaw = msgText.substring(1).trim().split('@')[0];
            if (targetRaw === 'guest') {
                await env.ICON_KV.put(`tg_state:${chatRoomId}`, JSON.stringify({ role: 'guest', category: '' }));
                await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: "✅ <b>已成功切换存放位置</b>\n\n当前目标：🌍 <b>游客区</b>\n\n您接下来发送的所有图片将自动存入此区。\n<i>(如需切回管理区，请发送 /admin)</i>", parse_mode: 'HTML' }) });
            } else if (targetRaw === 'admin') {
                await env.ICON_KV.put(`tg_state:${chatRoomId}`, JSON.stringify({ role: 'admin', category: '' }));
                await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: "✅ <b>已成功切换存放位置</b>\n\n当前目标：🛡️ <b>管理区</b> (默认散装)\n\n您接下来发送的所有图片将自动存入此区。\n<i>(如需新建特定合集，请直接发送 如: /test)</i>", parse_mode: 'HTML' }) });
            } else if (targetRaw !== '') {
                const cleanTarget = targetRaw.replace(/[:/]/g, '');
                await env.ICON_KV.put(`tg_state:${chatRoomId}`, JSON.stringify({ role: 'admin', category: cleanTarget }));
                await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: `✅ <b>已成功切换存放位置</b>\n\n当前目标：📁 <b>${cleanTarget}</b> (管理区特定合集)\n\n您接下来发送的所有图片将自动归类到此合集。\n<i>(如需切回散装管理区，请发送 /admin)</i>`, parse_mode: 'HTML' }) });
            }
            return new Response('OK');
        }

        if (update.message.photo || update.message.document) {
          let stateStr = await env.ICON_KV.get(`tg_state:${chatRoomId}`);
          let state = stateStr ? JSON.parse(stateStr) : { role: 'admin', category: '' };
          let role = state.role || 'admin'; let tgCategory = state.category || '';

          let fileId, tgIconName; let caption = update.message.caption || ''; let isDocument = !!update.message.document;

          if (caption.startsWith('/')) {
              const tempTarget = caption.substring(1).trim().split('@')[0];
              if (tempTarget === 'guest') { role = 'guest'; tgCategory = ''; }
              else if (tempTarget === 'admin') { role = 'admin'; tgCategory = ''; }
              else { role = 'admin'; tgCategory = tempTarget.replace(/[:/]/g, ''); }
              caption = ''; 
          }

          if (isDocument) {
              const doc = update.message.document; if (!doc.mime_type || !doc.mime_type.startsWith('image/')) return new Response('OK');
              fileId = doc.file_id; let rawName = doc.file_name || `tg_icon_${Date.now()}.png`; tgIconName = rawName.replace(/\.[^/.]+$/, ""); 
              if (caption) tgIconName = caption;
          } else { 
              const photo = update.message.photo.pop(); fileId = photo.file_id; tgIconName = caption || `tg_icon_${Date.now()}`; 
          }

          tgIconName = tgIconName.trim().replace(/[:/]/g, '_');
          const kvKey = tgCategory ? `${role}:${tgCategory}:${tgIconName}` : `${role}:${tgIconName}`;

          try {
            const fileInfoRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`); const fileInfo = await fileInfoRes.json();
            const imageRes = await fetch(`https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fileInfo.result.file_path}`); const imageBuffer = await imageRes.arrayBuffer();
            const sizeStr = formatSize(imageBuffer.byteLength);
            
            const fileExt = isDocument && update.message.document.file_name ? update.message.document.file_name.split('.').pop() : 'png';
            const r2Path = `tg/${tgIconName}_${Date.now()}.${fileExt}`;
            await env.ICON_R2.put(r2Path, imageBuffer); const publicUrl = `${hostUrl}/${r2Path}`;

            // [管理机器人上传] -> 仅回复到当前会话，不做群推送！
            let replyMsgId = null; let catText = role === 'guest' ? '[🌍游客区]' : (tgCategory ? ` [📁${tgCategory}]` : ' [🛡️管理区]');
            const tgRes = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatRoomId, text: `✅ <b>入库成功${catText}</b> | <code>${tgIconName}</code>\n📦 大小: <code>${sizeStr}</code>`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🗑️ 彻底删除", callback_data: `del_kv:${kvKey}` }]] } })
            });
            
            if (tgRes.ok) { const tgData = await tgRes.json(); replyMsgId = tgData.result.message_id; }
            await env.ICON_KV.put(kvKey, JSON.stringify({ url: publicUrl, msgId: replyMsgId, chatId: chatRoomId, size: sizeStr }));
          } catch (err) { await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: `❌ 存入失败: [${tgIconName}]` }) }); }
        }
      }
      return new Response('OK');
    }

    // ==========================================
    // 🤖 TG 游客专属 Bot 引擎 (需要去环境变量配 GUEST_TG_BOT_TOKEN)
    // ==========================================
    if (env.GUEST_TG_BOT_TOKEN && request.method === 'POST' && path === `/webhook/tg_guest/${env.GUEST_TG_BOT_TOKEN}`) {
      const update = await request.json();

      const guestMenuText = `👋 <b>欢迎使用游客专属图标上传机器人！</b>

===========================
📤 <b>【如何上传图标？】</b>
👉 <b>直接点击聊天框左下的 📎 (附件) 图标</b>
👉 选择单张图片发给我，系统会自动收录到游客区！
<i>*(如果选发送文件则默认原文件名，选发送图片则默认随机名，也可在说明里自定义)*</i>

🌐 <b>游客图库与网页端：</b>
${hostUrl}/gallery

🔗 <b>游客订阅链接：</b>
${hostUrl}/guest.json
===========================`;

      if (update.callback_query) {
        const cb = update.callback_query; const data = cb.data;
        await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: cb.id }) }).catch(()=>{});
        
        if (data.startsWith('del_kv:')) {
          const kvKey = data.replace('del_kv:', '');
          ctx.waitUntil((async () => {
              await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/editMessageText`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: cb.message.chat.id, message_id: cb.message.message_id, text: `🗑️ 图标[${kvKey.split(':').pop()}] 已被撤回。` }) });
              const rawValue = await env.ICON_KV.get(kvKey);
              if (rawValue) {
                  const { url, msgId, chatId } = parseKvValue(rawValue);
                  if (url) { const urlObj = new URL(url); const r2Path = decodeURIComponent(urlObj.pathname.substring(1)); await env.ICON_R2.delete(r2Path); }
                  await env.ICON_KV.delete(kvKey);
                  if (msgId && chatId) { fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/deleteMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, message_id: msgId }) }).catch(() => {}); }
              }
          })());
        }
        return new Response('OK');
      }

      if (update.message) {
        const chatRoomId = String(update.message.chat.id);
        const msgText = update.message.text || '';

        if (msgText === '/start' || msgText === '/help') {
           await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: guestMenuText, parse_mode: 'HTML', disable_web_page_preview: true }) });
           return new Response('OK');
        }

        if (update.message.photo || update.message.document) {
          let fileId, tgIconName; let caption = update.message.caption || ''; let isDocument = !!update.message.document;

          if (isDocument) {
              const doc = update.message.document; if (!doc.mime_type || !doc.mime_type.startsWith('image/')) return new Response('OK');
              fileId = doc.file_id; let rawName = doc.file_name || `tg_icon_${Date.now()}.png`; tgIconName = rawName.replace(/\.[^/.]+$/, ""); 
              if (caption) tgIconName = caption;
          } else { 
              const photo = update.message.photo.pop(); fileId = photo.file_id; tgIconName = caption || `tg_icon_${Date.now()}`; 
          }

          tgIconName = tgIconName.trim().replace(/[:/]/g, '_');
          const role = 'guest'; const kvKey = `${role}:${tgIconName}`;

          try {
            const fileInfoRes = await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/getFile?file_id=${fileId}`); const fileInfo = await fileInfoRes.json();
            const imageRes = await fetch(`https://api.telegram.org/file/bot${env.GUEST_TG_BOT_TOKEN}/${fileInfo.result.file_path}`); const imageBuffer = await imageRes.arrayBuffer();
            const sizeStr = formatSize(imageBuffer.byteLength);
            
            const fileExt = isDocument && update.message.document.file_name ? update.message.document.file_name.split('.').pop() : 'png';
            const r2Path = `${role}/${tgIconName}_${Date.now()}.${fileExt}`;
            await env.ICON_R2.put(r2Path, imageBuffer); const publicUrl = `${hostUrl}/${r2Path}`;

            // 1. 回复给上传图片的游客
            let replyMsgId = null; 
            const tgRes = await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatRoomId, text: `✅ <b>入库成功 [🌍游客专属区]</b> | <code>${tgIconName}</code>\n📦 大小: <code>${sizeStr}</code>`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: "🗑️ 撤回删除", callback_data: `del_kv:${kvKey}` }]] } })
            });
            if (tgRes.ok) { const tgData = await tgRes.json(); replyMsgId = tgData.result.message_id; }
            
            // 2. [新增推送] -> 利用主管理机器人的 Token，推送到管理员中心群
            const primaryTargetId = env.ADMIN_CHAT_ID ? String(env.ADMIN_CHAT_ID).split(',')[0].trim() : null;
            if (primaryTargetId && env.TG_BOT_TOKEN && String(chatRoomId) !== primaryTargetId) {
                fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      chat_id: primaryTargetId, 
                      text: `🔔 <b>游客机器人上传 [🌍游客区]</b>\n名称: <code>${tgIconName}</code>\n📦 大小: <code>${sizeStr}</code>\n链接: ${publicUrl}`, 
                      parse_mode: 'HTML', 
                      reply_markup: { inline_keyboard: [[{ text: "🗑️ 彻底删除", callback_data: `del_kv:${kvKey}` }]] }
                  })
                }).catch(() => {});
            }

            await env.ICON_KV.put(kvKey, JSON.stringify({ url: publicUrl, msgId: replyMsgId, chatId: chatRoomId, size: sizeStr }));
          } catch (err) { await fetch(`https://api.telegram.org/bot${env.GUEST_TG_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatRoomId, text: `❌ 存入失败:[${tgIconName}]` }) }); }
        }
      }
      return new Response('OK');
    }

    // ==========================================
    // 🟢 R2 图片静态回源代理 
    // ==========================================
    if (request.method === 'GET' && !path.startsWith('/api') && path !== '/' && path !== '/gallery' && path !== '/admin' && !path.endsWith('.json')) {
        const r2Path = decodeURIComponent(path.substring(1)); 
        const object = await env.ICON_R2.get(r2Path);
        if (object) { const headers = new Headers(); object.writeHttpMetadata(headers); headers.set('etag', object.httpEtag); headers.set('Cache-Control', 'public, max-age=31536000'); return new Response(object.body, { headers }); }
    }

    return new Response('Not Found', { status: 404 });
  }
};
