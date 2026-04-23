// ============================================
// 後台共用左側導航（自動注入）
// 使用方式：頁面載入 <script src="assets/admin-nav.js" defer></script>
// 會偵測目前 URL、注入 sidebar、將原 body 內容 wrap 進 .admin-main
// ============================================

(function () {
  const NAV = [
    {
      label: '營運總覽',
      items: [
        { href: 'dashboard.html', icon: '📊', text: '營運儀表板' }
      ]
    },
    {
      label: '會員與推廣',
      items: [
        { href: 'members.html', icon: '👥', text: '會員管理' },
        { href: 'richmenu.html', icon: '🎨', text: 'Rich Menu 預覽' }
      ]
    },
    {
      label: '景點與驗證',
      items: [
        { href: 'refs-admin.html', icon: '📷', text: '景點參考照' },
        { href: 'review.html',     icon: '👁',  text: '照片人工覆核' }
      ]
    },
    {
      label: '店家工具',
      items: [
        { href: 'admin.html',    icon: '🛠️', text: '店家資料管理' },
        { href: 'merchant.html', icon: '🖨️', text: 'QR Code 產生器' },
        { href: 'verify.html',   icon: '✅', text: '店家核銷後台' }
      ]
    }
  ];

  function currentPage() {
    let path = window.location.pathname.split('/').pop() || 'index.html';
    // 部分主機（如 Vercel）會把 foo.html 重寫為 foo — 自動補 .html
    if (path && !path.includes('.')) path += '.html';
    return path;
  }

  function renderSidebar() {
    const cur = currentPage();
    const groups = NAV.map(g => `
      <div class="admin-sidebar-group">
        <div class="admin-sidebar-group-label">${g.label}</div>
        ${g.items.map(i => `
          <a href="${i.href}" class="admin-sidebar-link${i.href === cur ? ' active' : ''}">
            <span class="an-icon">${i.icon}</span>
            <span>${i.text}</span>
          </a>
        `).join('')}
      </div>
    `).join('');

    return `
      <aside class="admin-sidebar" id="adminSidebar">
        <div class="admin-sidebar-brand">
          日月潭低碳後台
          <small>Operator Console</small>
        </div>
        ${groups}
        <div class="admin-sidebar-divider"></div>
        <a href="index.html" class="admin-sidebar-link">
          <span class="an-icon">←</span>
          <span>返回遊客端</span>
        </a>
        <div class="admin-sidebar-footer">
          魚光窯烤 · OneLife Eats<br>
          Sun Moon Lake Low-Carbon
        </div>
      </aside>
    `;
  }

  function wrapBody() {
    if (document.body.classList.contains('admin-shell')) return;
    document.body.classList.add('admin-shell');

    const existing = Array.from(document.body.childNodes);

    // 建立 layout 容器
    const layout = document.createElement('div');
    layout.className = 'admin-layout';

    // 注入 sidebar
    const sidebarWrap = document.createElement('div');
    sidebarWrap.innerHTML = renderSidebar();
    layout.appendChild(sidebarWrap.firstElementChild);

    // 建立 main 容器，將原內容搬進去
    const main = document.createElement('div');
    main.className = 'admin-main';
    existing.forEach(n => main.appendChild(n));
    layout.appendChild(main);

    document.body.appendChild(layout);

    // 漢堡按鈕 + 手機 backdrop
    const burger = document.createElement('button');
    burger.className = 'admin-hamburger';
    burger.setAttribute('aria-label', '選單');
    burger.textContent = '☰';
    document.body.appendChild(burger);

    const backdrop = document.createElement('div');
    backdrop.className = 'admin-backdrop';
    document.body.appendChild(backdrop);

    const sidebar = document.getElementById('adminSidebar');
    const toggle = (show) => {
      sidebar.classList.toggle('open', show);
      backdrop.classList.toggle('open', show);
    };
    burger.onclick = () => toggle(!sidebar.classList.contains('open'));
    backdrop.onclick = () => toggle(false);
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('.admin-sidebar-link')) toggle(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wrapBody);
  } else {
    wrapBody();
  }
})();
