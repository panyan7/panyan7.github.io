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
    scheduleBrandAlign();
    watchBrandAlign();
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

/**
 * Line up .page-title-align-brand with the Yan Pan text (same vertical center).
 *
 * Adds to the current margin (CSS calc is the first-paint fallback). Never
 * reset to 0 before measuring — overlapping calls used to write 0 and leave
 * the title high until the next resize.
 */
function alignBrandHeading() {
    var brand = document.querySelector('.site-nav-item--brand .site-nav-text--brand') ||
        document.querySelector('.site-nav-item--brand');
    if (!brand) return false;

    var targets = document.querySelectorAll('.page-title-align-brand');
    if (!targets.length) return false;

    var brandRect = brand.getBoundingClientRect();
    if (!brandRect.height) return false;
    var brandMid = brandRect.top + brandRect.height / 2;
    var applied = false;

    for (var j = 0; j < targets.length; j++) {
        var el = targets[j];
        var titleRect = el.getBoundingClientRect();
        if (!titleRect.height) continue;
        var delta = brandMid - (titleRect.top + titleRect.height / 2);
        if (Math.abs(delta) < 0.5) {
            applied = true;
            continue;
        }
        var current = parseFloat(window.getComputedStyle(el).marginTop) || 0;
        el.style.marginTop = (current + delta) + 'px';
        applied = true;
    }
    return applied;
}

function scheduleBrandAlign() {
    window.__alignBrandGen = (window.__alignBrandGen || 0) + 1;
    var gen = window.__alignBrandGen;
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            if (gen !== window.__alignBrandGen) return;
            alignBrandHeading();
        });
    });
}

function watchBrandAlign() {
    if (!window.__brandAlignWatched) {
        window.__brandAlignWatched = true;

        window.addEventListener('load', function () {
            scheduleBrandAlign();
        });

        if (document.fonts) {
            if (document.fonts.ready) {
                document.fonts.ready.then(scheduleBrandAlign);
            }
            if (document.fonts.addEventListener) {
                document.fonts.addEventListener('loadingdone', scheduleBrandAlign);
            }
        }

    }

    var brand = document.querySelector('.site-nav-item--brand .site-nav-text--brand') ||
        document.querySelector('.site-nav-item--brand');
    if (!brand || typeof ResizeObserver !== 'function') return;

    if (window.__brandAlignObs) {
        window.__brandAlignObs.disconnect();
    } else {
        window.__brandAlignObs = new ResizeObserver(function () {
            scheduleBrandAlign();
        });
    }
    window.__brandAlignObs.observe(brand);
}

// Re-align / re-stack after resize
window.addEventListener('resize', function () {
    clearTimeout(window.__alignBrandTimer);
    window.__alignBrandTimer = setTimeout(function () {
        if (window.HexLayout) {
            var page = window.HexLayout.currentPageFile();
            var opts = { activePage: page };
            if (document.body.classList.contains('hex-post-mode')) {
                opts.showDividers = false;
            } else if (document.body.classList.contains('hex-board-mode')) {
                opts.showDividers = true;
            }
            window.HexLayout.mountSidebar(opts);
            layoutMainContent();
            watchBrandAlign();
        }
        scheduleBrandAlign();
    }, 100);
});

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
