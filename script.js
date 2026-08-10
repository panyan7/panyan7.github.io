// Site shell: hex-stable sidebar + light page helpers
document.addEventListener('DOMContentLoaded', function () {
    mountSiteNav();

    // Smooth scroll for in-page anchors only (not bare "#")
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href === '#') return;
        link.addEventListener('click', function (e) {
            var targetId = href.substring(1);
            var targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

function mountSiteNav() {
    if (!window.HexLayout) {
        // Fallback if hex-layout failed to load
        loadSidebarLegacy();
        return;
    }

    // Writings page mounts sidebar via HexBoard; still ok to mount here first
    var page = window.HexLayout.currentPageFile();
    window.HexLayout.mountSidebar({ activePage: page });

    // Position main content from the same metrics as the sidebar
    layoutMainContent();
}

function layoutMainContent() {
    var m = window.HexLayout && window.HexLayout.getMetrics();
    if (!m) return;

    var content = document.querySelector('main.content, .site-content');
    if (!content) return;

    // Writings board owns the full viewport; skip flex content layout
    if (document.body.classList.contains('writings-page') &&
        !document.body.classList.contains('hex-post-mode')) {
        return;
    }

    content.classList.add('hex-positioned-content');
}

function loadSidebarLegacy() {
    var sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    fetch('../sidebar.html?t=' + Date.now())
        .then(function (response) {
            if (!response.ok) throw new Error('Failed to fetch sidebar');
            return response.text();
        })
        .then(function (html) {
            sidebarContainer.innerHTML = html;
            setActiveNavigationLink();
        })
        .catch(function () {
            sidebarContainer.innerHTML =
                '<nav class="sidebar">' +
                '<div class="nav-header"><h1>Yan Pan</h1></div>' +
                '<ul class="nav-links">' +
                '<li><a href="home.html" class="nav-link">Home</a></li>' +
                '<li><a href="about.html" class="nav-link">About</a></li>' +
                '<li><a href="writings.html" class="nav-link">Writings</a></li>' +
                '<li><a href="https://www.instagram.com/yanpanphoto/" class="nav-link" target="_blank" rel="noopener">Photo</a></li>' +
                '</ul></nav>';
            setActiveNavigationLink();
        });
}

function setActiveNavigationLink() {
    var navLinks = document.querySelectorAll('.nav-link, .site-nav-link');
    var currentPage = window.location.pathname.split('/').pop() || 'home.html';

    navLinks.forEach(function (link) {
        var linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'home.html')) {
            link.classList.add('active');
            if (link.closest('.site-nav-item')) {
                link.closest('.site-nav-item').classList.add('is-active');
            }
        } else {
            link.classList.remove('active');
            if (link.closest('.site-nav-item')) {
                link.closest('.site-nav-item').classList.remove('is-active');
            }
        }
    });
}
