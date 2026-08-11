/**
 * Shared site hex layout (flat-top: horizontal top/bottom edges).
 *
 * - Same metrics on every page so the sidebar never jumps.
 * - Name occupies one full hex; nav links occupy half-hex vertical slots
 *   so spacing is tighter while text stays on one vertical line.
 * - Hex outlines are only drawn when requested (writings page).
 */
(function (global) {
    'use strict';

    var MAX_COL_W = 800; // matches .container max-width
    var PAD_REM = 4;     // matches .container padding

    /**
     * === Hex size knobs (edit these) ===
     * size = OUTER hex radius (center → vertex). Lattice spacing uses this,
     * so outer hexes sit adjacent. Content blocks also draw a smaller inner
     * ring at size / INNER_RATIO (see hex-board.js).
     *
     * BASE_SIZE  preferred outer radius when the viewport allows it
     * MIN_SIZE   never smaller than this
     * MAX_SIZE   never larger than this
     * SCALE      multiplies the auto-fit result (1.2 ≈ +20%)
     */
    var BASE_SIZE = 64;
    var MIN_SIZE = 48;
    var MAX_SIZE = 96;
    var SCALE = 1.2;

    var DIRS = [
        [+1, 0], [0, -1], [-1, 0],
        [-1, +1], [0, +1], [+1, -1]
    ];

    var NAV_LINKS = [
        { id: 'home', text: 'Home', href: 'home.html' },
        { id: 'about', text: 'About', href: 'about.html' },
        { id: 'writings', text: 'Writings', href: 'writings.html' },
        {
            id: 'photo',
            text: 'Photo',
            href: 'https://www.instagram.com/yanpanphoto/',
            external: true
        }
    ];

    var cached = null;

    function remPx() {
        var fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return isFinite(fs) && fs > 0 ? fs : 14;
    }

    /** Flat-top axial → pixel (relative to origin). */
    function axialToPixel(q, r, size) {
        var x = size * (1.5 * q);
        var y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        return { x: x, y: y };
    }

    function pixelToAxial(px, py, size, originX, originY) {
        var x = px - originX;
        var y = py - originY;
        var q = (2 / 3 * x) / size;
        var r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
        return { q: q, r: r };
    }

    function hexCorners(cx, cy, size) {
        var pts = [];
        for (var i = 0; i < 6; i++) {
            // Flat-top: vertex at 0°
            var angle = (Math.PI / 180) * (60 * i);
            pts.push({
                x: cx + size * Math.cos(angle),
                y: cy + size * Math.sin(angle)
            });
        }
        return pts;
    }

    function pointsAttr(pts) {
        return pts.map(function (p) {
            return p.x.toFixed(2) + ',' + p.y.toFixed(2);
        }).join(' ');
    }

    /**
     * Metrics matching the original centered 800px column.
     * Sidebar hex column sits where the old 25% sidebar was.
     * On narrow viewports, shrink pad + hex radius so ~5 content columns fit.
     */
    function computeMetrics(vw, vh) {
        vw = vw || window.innerWidth;
        vh = vh || window.innerHeight;

        var isMobile = vw < 768;
        var pad = (isMobile ? 1.25 : PAD_REM) * remPx();
        var boxW = Math.min(vw, MAX_COL_W);
        var boxLeft = (vw - boxW) / 2;
        var innerLeft = boxLeft + pad;
        var innerTop = pad;
        var innerW = Math.max(120, boxW - 2 * pad);
        var innerH = Math.max(120, vh - 2 * pad);
        // Slightly wider sidebar fraction on mobile so brand/nav stay readable
        var sidebarFrac = isMobile ? 0.28 : 0.25;
        var sidebarW = innerW * sidebarFrac;
        var contentLeft = innerLeft + sidebarW;
        var contentW = innerW - sidebarW;

        // Flat-top: width = 2R, height = √3 R; vertical neighbor step = √3 R
        var minSize = isMobile ? 26 : MIN_SIZE;
        var maxSize = isMobile ? 42 : MAX_SIZE;
        var scale = isMobile ? 1.0 : SCALE;

        var sizeBySidebar = sidebarW * (isMobile ? 0.62 : 0.55);
        // Fit brand + half-step nav stack + bottom margin
        var sizeByHeight = innerH / (Math.sqrt(3) * (isMobile ? 6.5 : 5.2));
        // Content runs roughly q=0..4; right edge ≈ brandCx + 1.5*size*4 + size
        // Use conservative fit so col-5 stays on-screen
        var sizeByWidth = (vw - pad * 2) / (isMobile ? 9.5 : 8.5);

        var size = Math.floor(
            Math.min(BASE_SIZE, sizeBySidebar, sizeByHeight, sizeByWidth) * scale
        );
        size = Math.max(minSize, Math.min(maxSize, size));

        var hexH = size * Math.sqrt(3); // full hex height / vertical step
        var hexW = size * 2;

        // Brand center: middle of old sidebar column, near top (like original nav-header)
        var brandCx = innerLeft + sidebarW * 0.5;
        var brandCy = innerTop + hexH * (isMobile ? 0.5 : 0.55);

        // Keep rightmost content hex (≈ q=4) inside the viewport
        var rightmost = brandCx + size * 1.5 * 4 + size;
        if (rightmost > vw - pad) {
            var fit = Math.floor((vw - pad - brandCx) / 7);
            if (fit >= minSize && fit < size) {
                size = fit;
                hexH = size * Math.sqrt(3);
                hexW = size * 2;
                brandCy = innerTop + hexH * (isMobile ? 0.5 : 0.55);
            }
        }

        // Axial (0,0) = brand center
        var originX = brandCx;
        var originY = brandCy;

        /**
         * Vertical slots (centers), same x = brandCx:
         * - Brand: 1 full hex
         * - Each nav: ½ hex pitch (closer than full lattice steps)
         *
         * Footprints abut: brand [yB±H/2], then navs of height H/2.
         * Centers: yB, yB+0.75H, yB+1.25H, yB+1.75H, yB+2.25H
         */
        var slots = [
            { id: 'brand', kind: 'brand', text: 'Yan Pan', units: 1, x: brandCx, y: brandCy }
        ];
        NAV_LINKS.forEach(function (link, i) {
            slots.push({
                id: link.id,
                kind: 'nav',
                text: link.text,
                href: link.href,
                external: !!link.external,
                units: 0.5,
                x: brandCx,
                // first nav center at brand + 0.75 full heights, then +0.5 each
                y: brandCy + hexH * (0.75 + i * 0.5)
            });
        });

        return {
            vw: vw,
            vh: vh,
            pad: pad,
            boxW: boxW,
            boxLeft: boxLeft,
            innerLeft: innerLeft,
            innerTop: innerTop,
            innerW: innerW,
            innerH: innerH,
            sidebarW: sidebarW,
            contentLeft: contentLeft,
            contentW: contentW,
            size: size,
            hexH: hexH,
            hexW: hexW,
            originX: originX,
            originY: originY,
            brandCx: brandCx,
            brandCy: brandCy,
            slots: slots
        };
    }

    function getMetrics(force) {
        if (!cached || force) {
            cached = computeMetrics(window.innerWidth, window.innerHeight);
        }
        return cached;
    }

    function invalidate() {
        cached = null;
    }

    function cellCenter(q, r, m) {
        m = m || getMetrics();
        var p = axialToPixel(q, r, m.size);
        return { x: p.x + m.originX, y: p.y + m.originY };
    }

    function currentPageFile() {
        var file = window.location.pathname.split('/').pop() || '';
        if (!file || file === '') return 'home.html';
        return file;
    }

    function applyCssVars(m) {
        var root = document.documentElement;
        root.style.setProperty('--hex-size', m.size + 'px');
        root.style.setProperty('--hex-h', m.hexH + 'px');
        root.style.setProperty('--site-content-left', m.contentLeft + 'px');
        root.style.setProperty('--site-content-width', m.contentW + 'px');
        root.style.setProperty('--site-content-top', m.innerTop + 'px');
        root.style.setProperty('--site-pad', m.pad + 'px');
        root.style.setProperty('--site-sidebar-x', m.brandCx + 'px');
        // Vertical center of the Yan Pan brand hex (viewport coords)
        root.style.setProperty('--site-brand-cy', m.brandCy + 'px');
    }

    /**
     * Render fixed sidebar from hex slots (same positions on every page).
     * Hex outlines only on writings list; nav coordinates always match the lattice.
     */
    function mountSidebar(options) {
        options = options || {};
        var m = getMetrics(true);
        applyCssVars(m);

        var host = document.getElementById('site-nav');
        if (!host) {
            host = document.createElement('nav');
            host.id = 'site-nav';
            host.setAttribute('aria-label', 'Primary');
            document.body.insertBefore(host, document.body.firstChild);
        }

        var page = options.activePage || currentPageFile();
        host.className = 'site-nav';
        document.body.classList.remove('site-nav-stacked');

        var html = '';
        var navSlots = m.slots.filter(function (s) {
            return s.kind === 'nav';
        });

        m.slots.forEach(function (slot) {
            var isBrand = slot.kind === 'brand';
            var h = isBrand ? m.hexH : m.hexH * 0.5;
            var w = m.hexW * 0.92;
            var left = slot.x - w / 2;
            var top = slot.y - h / 2;
            var active = !isBrand && slot.href === page;

            var cls = 'site-nav-item site-nav-item--' + slot.kind;
            if (active) cls += ' is-active';

            var style =
                'left:' + left.toFixed(1) + 'px;' +
                'top:' + top.toFixed(1) + 'px;' +
                'width:' + w.toFixed(1) + 'px;' +
                'height:' + h.toFixed(1) + 'px;';

            if (isBrand) {
                html +=
                    '<div class="' + cls + '" style="' + style + '">' +
                    '<span class="site-nav-text site-nav-text--brand">Yan Pan</span>' +
                    '</div>';
            } else {
                var target = slot.external ? ' target="_blank" rel="noopener"' : '';
                html +=
                    '<div class="' + cls + '" style="' + style + '">' +
                    '<a class="site-nav-link" href="' + slot.href + '"' + target + '>' +
                    slot.text +
                    '</a></div>';
            }
        });

        // Dividers only on writings list (hex board), not article view or other pages
        var showDividers = options.showDividers === true ||
            (options.showDividers !== false &&
                document.body.classList.contains('hex-board-mode') &&
                !document.body.classList.contains('hex-post-mode'));
        if (showDividers) {
            for (var p = 0; p + 1 < navSlots.length; p += 2) {
                var a = navSlots[p];
                var b = navSlots[p + 1];
                var midY = (a.y + b.y) / 2;
                var lineW = m.hexW * 0.72;
                var lineLeft = m.brandCx - lineW / 2;
                html +=
                    '<div class="site-nav-divider" style="' +
                    'left:' + lineLeft.toFixed(1) + 'px;' +
                    'top:' + midY.toFixed(1) + 'px;' +
                    'width:' + lineW.toFixed(1) + 'px;"' +
                    ' aria-hidden="true"></div>';
            }
        }

        host.innerHTML = html;
        host.hidden = false;
        document.body.classList.add('hex-site-layout');

        return m;
    }

    /** Axial range covering the viewport (for full board drawing). */
    function coverRange(m) {
        m = m || getMetrics();
        var samples = [
            [0, 0], [m.vw, 0], [0, m.vh], [m.vw, m.vh],
            [m.vw / 2, 0], [m.vw / 2, m.vh], [0, m.vh / 2], [m.vw, m.vh / 2]
        ];
        var minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
        samples.forEach(function (s) {
            var a = pixelToAxial(s[0], s[1], m.size, m.originX, m.originY);
            if (a.q < minQ) minQ = a.q;
            if (a.q > maxQ) maxQ = a.q;
            if (a.r < minR) minR = a.r;
            if (a.r > maxR) maxR = a.r;
        });
        var pad = 2;
        return {
            minQ: Math.floor(minQ) - pad,
            maxQ: Math.ceil(maxQ) + pad,
            minR: Math.floor(minR) - pad,
            maxR: Math.ceil(maxR) + pad
        };
    }

    function neighbors(q, r) {
        return DIRS.map(function (d) {
            return { q: q + d[0], r: r + d[1] };
        });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
        invalidate();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (document.body.classList.contains('hex-site-layout')) {
                mountSidebar({ activePage: currentPageFile() });
            }
            if (global.HexBoard && typeof global.HexBoard.onLayoutChange === 'function') {
                global.HexBoard.onLayoutChange();
            }
        }, 80);
    });

    global.HexLayout = {
        axialToPixel: axialToPixel,
        pixelToAxial: pixelToAxial,
        hexCorners: hexCorners,
        pointsAttr: pointsAttr,
        neighbors: neighbors,
        getMetrics: getMetrics,
        computeMetrics: computeMetrics,
        invalidate: invalidate,
        cellCenter: cellCenter,
        coverRange: coverRange,
        mountSidebar: mountSidebar,
        applyCssVars: applyCssVars,
        currentPageFile: currentPageFile,
        NAV_LINKS: NAV_LINKS
    };
})(window);
