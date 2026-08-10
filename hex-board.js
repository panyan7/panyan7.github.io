/**
 * Writings hex board — one shared pointy-top honeycomb
 * (vertical sides). Content may span multiple horizontal hexes.
 */
(function (global) {
    'use strict';

    // Axial neighbors (cube-compatible)
    var DIRS = [
        [+1, 0], [+1, -1], [0, -1],
        [-1, 0], [-1, +1], [0, +1]
    ];

    var VIDEO_SRC = 'https://www.youtube-nocookie.com/embed/imBlPXbAv6E?rel=0&autoplay=1';

    var state = {
        size: 56,
        originX: 0,
        originY: 0,
        blogs: [],
        content: [], // {q,r,span,type,...}  span defaults to 1
        playerExpanded: false,
        visible: true
    };

    function key(q, r) {
        return q + ',' + r;
    }

    /** Pointy-top: vertical sides (flat left/right). */
    function axialToPixel(q, r, size) {
        var x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        var y = size * (1.5 * r);
        return { x: x, y: y };
    }

    function pixelToAxial(px, py, size, originX, originY) {
        var x = px - originX;
        var y = py - originY;
        var q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
        var r = (2 / 3 * y) / size;
        return { q: q, r: r };
    }

    function hexCorners(cx, cy, size) {
        var pts = [];
        for (var i = 0; i < 6; i++) {
            // Pointy-top: first vertex at -30°
            var angle = (Math.PI / 180) * (60 * i - 30);
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

    function neighbors(q, r) {
        return DIRS.map(function (d) {
            return { q: q + d[0], r: r + d[1] };
        });
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDateCondensed(dateString) {
        var parts = dateString.split('-');
        var date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' });
    }

    function isFree(q, r, reserved) {
        return !reserved[key(q, r)];
    }

    /**
     * Find a free single cell near seeds.
     */
    function findSlot(reserved, seeds) {
        var seen = {};
        var queue = [];
        (seeds || []).forEach(function (s) {
            queue.push({ q: s.q, r: s.r });
        });

        while (queue.length) {
            var cur = queue.shift();
            var k = key(cur.q, cur.r);
            if (seen[k]) continue;
            seen[k] = true;
            if (isFree(cur.q, cur.r, reserved)) {
                return { q: cur.q, r: cur.r };
            }
            neighbors(cur.q, cur.r).forEach(function (n) {
                if (!seen[key(n.q, n.r)]) queue.push(n);
            });
        }

        var origin = (seeds && seeds[0]) || { q: 0, r: 0 };
        for (var rad = 1; rad < 12; rad++) {
            for (var dq = -rad; dq <= rad; dq++) {
                for (var dr = -rad; dr <= rad; dr++) {
                    if (isFree(origin.q + dq, origin.r + dr, reserved)) {
                        return { q: origin.q + dq, r: origin.r + dr };
                    }
                }
            }
        }
        return { q: origin.q, r: origin.r + 3 };
    }

    /**
     * Find two free cells that share an edge (one bilingual blog block).
     * Prefer horizontal pair (+1,0) so title | title_en sit side by side.
     */
    function findPairSlot(reserved, seeds) {
        var pairDirs = [
            [1, 0],   // east (horizontal — preferred)
            [-1, 0],  // west
            [0, 1], [0, -1], [1, -1], [-1, 1]
        ];
        var seen = {};
        var queue = [];
        (seeds || []).forEach(function (s) {
            queue.push({ q: s.q, r: s.r });
        });

        while (queue.length) {
            var cur = queue.shift();
            var k = key(cur.q, cur.r);
            if (seen[k]) continue;
            seen[k] = true;

            if (isFree(cur.q, cur.r, reserved)) {
                for (var d = 0; d < pairDirs.length; d++) {
                    var nq = cur.q + pairDirs[d][0];
                    var nr = cur.r + pairDirs[d][1];
                    if (isFree(nq, nr, reserved)) {
                        // Normalize so primary is the "leftier" of horizontal pairs
                        if (pairDirs[d][0] < 0 || (pairDirs[d][0] === 0 && pairDirs[d][1] < 0)) {
                            return {
                                primary: { q: nq, r: nr },
                                secondary: { q: cur.q, r: cur.r }
                            };
                        }
                        return {
                            primary: { q: cur.q, r: cur.r },
                            secondary: { q: nq, r: nr }
                        };
                    }
                }
            }

            neighbors(cur.q, cur.r).forEach(function (n) {
                if (!seen[key(n.q, n.r)]) queue.push(n);
            });
        }

        // Fallback: place primary free, secondary to the east if free else any neighbor
        var p = findSlot(reserved, seeds);
        for (var i = 0; i < pairDirs.length; i++) {
            var sq = p.q + pairDirs[i][0];
            var sr = p.r + pairDirs[i][1];
            if (isFree(sq, sr, reserved) && !(sq === p.q && sr === p.r)) {
                return { primary: p, secondary: { q: sq, r: sr } };
            }
        }
        return {
            primary: p,
            secondary: { q: p.q + 1, r: p.r }
        };
    }

    /** Place nav, title, intro, blogs, player on one lattice. */
    function placeContent(blogs) {
        var cells = [];
        var reserved = {};
        var seeds = [];

        function take(q, r, data) {
            reserved[key(q, r)] = true;
            cells.push(Object.assign({ q: q, r: r }, data));
            seeds.push({ q: q, r: r });
        }

        // --- Nav: vertical chain along +r (one text per hex) ---
        take(0, 0, { type: 'brand', text: 'Yan Pan' });
        take(0, 1, { type: 'nav', text: 'Home', href: 'home.html' });
        take(0, 2, { type: 'nav', text: 'About', href: 'about.html' });
        take(0, 3, { type: 'nav', text: 'Writings', href: 'writings.html', active: true });
        take(0, 4, {
            type: 'nav',
            text: 'Photo',
            href: 'https://www.instagram.com/yanpanphoto/',
            external: true
        });

        // --- Title + intro: each string in its own hex ---
        var titleSlot = findSlot(reserved, [{ q: 2, r: 0 }, { q: 1, r: 0 }]);
        take(titleSlot.q, titleSlot.r, {
            type: 'title',
            text: 'The Library of Babel'
        });

        var introSlot = findSlot(reserved, [
            { q: titleSlot.q, r: titleSlot.r + 1 },
            { q: titleSlot.q + 1, r: titleSlot.r }
        ]);
        take(introSlot.q, introSlot.r, {
            type: 'intro',
            text: 'This is a collection of random, useless, and often unfinished thoughts.'
        });

        // --- Blogs: one hex per title; bilingual posts = two adjacent hexes, one block ---
        var blogSeed = [
            { q: introSlot.q, r: introSlot.r + 1 },
            { q: titleSlot.q + 1, r: titleSlot.r + 1 },
            { q: 2, r: 2 }
        ];

        for (var i = 0; i < blogs.length; i++) {
            var b = blogs[i];
            var hasEn = !!(b.titleEn && String(b.titleEn).trim());
            var blockId = b.filename;

            if (hasEn) {
                var pair = findPairSlot(reserved, blogSeed.concat(seeds.slice(-8)));
                take(pair.primary.q, pair.primary.r, {
                    type: 'blog',
                    text: b.title,
                    date: b.date,
                    filename: b.filename,
                    blockId: blockId
                });
                take(pair.secondary.q, pair.secondary.r, {
                    type: 'blog-en',
                    text: b.titleEn,
                    filename: b.filename,
                    blockId: blockId
                });
                blogSeed.push(pair.primary, pair.secondary);
                neighbors(pair.primary.q, pair.primary.r).forEach(function (n) {
                    blogSeed.push(n);
                });
                neighbors(pair.secondary.q, pair.secondary.r).forEach(function (n) {
                    blogSeed.push(n);
                });
            } else {
                var slot = findSlot(reserved, blogSeed.concat(seeds.slice(-8)));
                take(slot.q, slot.r, {
                    type: 'blog',
                    text: b.title,
                    date: b.date,
                    filename: b.filename,
                    blockId: blockId
                });
                blogSeed.push(slot);
                neighbors(slot.q, slot.r).forEach(function (n) {
                    blogSeed.push(n);
                });
            }
        }

        // --- Player: single hex ---
        var playerSlot = findSlot(reserved, blogSeed.concat(seeds.slice(-6)));
        take(playerSlot.q, playerSlot.r, {
            type: 'player',
            text: 'infinity repeating...'
        });

        return cells;
    }

    /**
     * Slightly larger hexes; center content cluster in the viewport.
     */
    function layoutMetrics(vw, vh, content) {
        // Pointy-top: width ≈ √3·size, vertical step 1.5·size
        var targetCols = 10;
        var targetRows = 8;

        var sizeByW = vw / (Math.sqrt(3) * targetCols + 1);
        var sizeByH = vh / (1.5 * targetRows + 1);
        var size = Math.floor(Math.min(sizeByW, sizeByH));
        size = Math.max(48, Math.min(size, 72));

        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        if (content && content.length) {
            content.forEach(function (c) {
                var p = axialToPixel(c.q, c.r, size);
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
        } else {
            minX = maxX = minY = maxY = 0;
        }

        // Pointy hex half-extents
        var halfW = size * Math.sqrt(3) / 2;
        var halfH = size;
        minX -= halfW;
        maxX += halfW;
        minY -= halfH;
        maxY += halfH;

        var contentCx = (minX + maxX) / 2;
        var contentCy = (minY + maxY) / 2;

        var originX = vw / 2 - contentCx;
        var originY = vh / 2 - contentCy - size * 0.1;

        return {
            size: size,
            originX: originX,
            originY: originY
        };
    }

    function coverRange(vw, vh, size, originX, originY) {
        var samples = [
            [0, 0], [vw, 0], [0, vh], [vw, vh],
            [vw / 2, 0], [vw / 2, vh], [0, vh / 2], [vw, vh / 2],
            [vw / 4, vh / 4], [3 * vw / 4, vh / 4],
            [vw / 4, 3 * vh / 4], [3 * vw / 4, 3 * vh / 4]
        ];
        var minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
        for (var i = 0; i < samples.length; i++) {
            var a = pixelToAxial(samples[i][0], samples[i][1], size, originX, originY);
            if (a.q < minQ) minQ = a.q;
            if (a.q > maxQ) maxQ = a.q;
            if (a.r < minR) minR = a.r;
            if (a.r > maxR) maxR = a.r;
        }
        var pad = 2;
        return {
            minQ: Math.floor(minQ) - pad,
            maxQ: Math.ceil(maxQ) + pad,
            minR: Math.floor(minR) - pad,
            maxR: Math.ceil(maxR) + pad
        };
    }

    function cellPixelCenter(q, r) {
        var p = axialToPixel(q, r, state.size);
        return {
            x: p.x + state.originX,
            y: p.y + state.originY
        };
    }

    function cellBox(cell) {
        var c0 = cellPixelCenter(cell.q, cell.r);
        return {
            cx: c0.x,
            cy: c0.y,
            w: state.size * Math.sqrt(3),
            h: state.size * 2
        };
    }

    function render() {
        var board = document.getElementById('hex-board');
        if (!board || !state.visible) return;

        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var metrics = layoutMetrics(vw, vh, state.content);
        state.size = metrics.size;
        state.originX = metrics.originX;
        state.originY = metrics.originY;

        var contentMap = {};
        state.content.forEach(function (c) {
            contentMap[key(c.q, c.r)] = c;
        });

        var range = coverRange(vw, vh, state.size, state.originX, state.originY);
        var svgParts = [];
        var labelParts = [];
        var margin = state.size * 2;

        for (var q = range.minQ; q <= range.maxQ; q++) {
            for (var r = range.minR; r <= range.maxR; r++) {
                var c = cellPixelCenter(q, r);
                if (c.x < -margin || c.x > vw + margin ||
                    c.y < -margin || c.y > vh + margin) {
                    continue;
                }

                var corners = hexCorners(c.x, c.y, state.size);
                var cell = contentMap[key(q, r)];
                var fill = cell ? '#ffffff' : 'none';

                svgParts.push(
                    '<polygon points="' + pointsAttr(corners) +
                    '" fill="' + fill +
                    '" stroke="#111111" stroke-width="1" stroke-linejoin="round"' +
                    ' data-q="' + q + '" data-r="' + r + '"/>'
                );

                if (cell) {
                    labelParts.push(renderLabel(cell));
                }
            }
        }

        board.innerHTML =
            '<svg class="hex-board-svg" width="' + vw + '" height="' + vh +
            '" viewBox="0 0 ' + vw + ' ' + vh + '" aria-hidden="true">' +
            svgParts.join('') +
            '</svg>' +
            '<div class="hex-labels">' + labelParts.join('') + '</div>';

        bindLabelEvents(board);
    }

    function renderLabel(cell) {
        var geo = cellBox(cell);
        var left = geo.cx - geo.w / 2;
        var top = geo.cy - geo.h / 2;
        var style =
            'left:' + left.toFixed(1) + 'px;top:' + top.toFixed(1) +
            'px;width:' + geo.w.toFixed(1) + 'px;height:' + geo.h.toFixed(1) + 'px;';

        var cls = 'hex-label hex-label--' + cell.type + ' hex-label--pointy';
        if (cell.active) cls += ' is-active';
        if (cell.blockId) cls += ' hex-label--block';

        var inner = '';

        if (cell.type === 'brand') {
            inner = '<span class="hex-label-text hex-label-text--brand">' +
                escapeHtml(cell.text) + '</span>';
        } else if (cell.type === 'nav') {
            var target = cell.external ? ' target="_blank" rel="noopener"' : '';
            inner =
                '<a class="hex-label-link" href="' + escapeHtml(cell.href) + '"' + target + '>' +
                escapeHtml(cell.text) + '</a>';
        } else if (cell.type === 'title') {
            inner = '<span class="hex-label-text hex-label-text--title">' +
                escapeHtml(cell.text) + '</span>';
        } else if (cell.type === 'intro') {
            inner = '<span class="hex-label-text hex-label-text--intro">' +
                escapeHtml(cell.text) + '</span>';
        } else if (cell.type === 'blog') {
            // Primary language title only (+ date). English lives in sibling hex if present.
            var date = formatDateCondensed(cell.date);
            inner =
                '<a class="hex-label-link hex-label-link--blog" href="#' +
                escapeHtml(cell.filename) + '">' +
                '<span class="hex-label-date">' + escapeHtml(date) + '</span>' +
                '<span class="hex-label-text">' + escapeHtml(cell.text) + '</span>' +
                '</a>';
        } else if (cell.type === 'blog-en') {
            // English title alone — same article as the adjacent title hex
            inner =
                '<a class="hex-label-link hex-label-link--blog hex-label-link--blog-en" href="#' +
                escapeHtml(cell.filename) + '">' +
                '<span class="hex-label-text hex-label-text--en">' +
                escapeHtml(cell.text) + '</span>' +
                '</a>';
        } else if (cell.type === 'player') {
            if (state.playerExpanded) {
                inner =
                    '<div class="hex-player-embed">' +
                    '<iframe src="' + VIDEO_SRC +
                    '" title="infinity repeating..."' +
                    ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
                    ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
                    '</div>';
            } else {
                inner =
                    '<button type="button" class="hex-player-btn" id="hex-player-btn">' +
                    escapeHtml(cell.text) +
                    '</button>';
            }
        }

        return (
            '<div class="' + cls + '" style="' + style +
            '" data-type="' + cell.type + '"' +
            (cell.blockId ? ' data-block="' + escapeHtml(cell.blockId) + '"' : '') +
            '>' +
            '<div class="hex-label-inner">' + inner + '</div></div>'
        );
    }

    function bindLabelEvents(board) {
        var btn = board.querySelector('#hex-player-btn');
        if (btn) {
            btn.addEventListener('click', function () {
                state.playerExpanded = true;
                render();
            });
        }

        // Bilingual pair: hover one hex → highlight both as one block
        var blockLabels = board.querySelectorAll('.hex-label--block[data-block]');
        blockLabels.forEach(function (el) {
            var blockId = el.getAttribute('data-block');
            if (!blockId) return;

            function peers() {
                return board.querySelectorAll(
                    '.hex-label--block[data-block="' + cssEscape(blockId) + '"]'
                );
            }

            el.addEventListener('mouseenter', function () {
                peers().forEach(function (peer) {
                    peer.classList.add('is-block-hover');
                });
            });
            el.addEventListener('mouseleave', function (e) {
                // Stay highlighted when moving between the two hexes of this block
                var related = e.relatedTarget;
                if (related && typeof related.closest === 'function') {
                    var other = related.closest('.hex-label--block[data-block]');
                    if (other && other.getAttribute('data-block') === blockId) {
                        return;
                    }
                }
                peers().forEach(function (peer) {
                    peer.classList.remove('is-block-hover');
                });
            });
        });
    }

    /** Escape for use inside a CSS attribute selector. */
    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(value);
        }
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function showList(blogs) {
        state.blogs = blogs || [];
        state.content = placeContent(state.blogs);
        state.visible = true;
        state.playerExpanded = false;

        var board = document.getElementById('hex-board');
        var panel = document.getElementById('post-panel');
        if (board) board.hidden = false;
        if (panel) {
            panel.hidden = true;
            panel.innerHTML = '';
        }
        document.body.classList.add('hex-board-mode');
        document.body.classList.remove('hex-post-mode');
        render();
    }

    function hideBoard() {
        state.visible = false;
        var board = document.getElementById('hex-board');
        if (board) board.hidden = true;
        document.body.classList.remove('hex-board-mode');
    }

    function showPostPanel(html) {
        hideBoard();
        var panel = document.getElementById('post-panel');
        if (panel) {
            panel.hidden = false;
            panel.innerHTML = html;
        }
        document.body.classList.add('hex-post-mode');
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
        if (!state.visible) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 100);
    });

    global.HexBoard = {
        showList: showList,
        hideBoard: hideBoard,
        showPostPanel: showPostPanel,
        render: render
    };
})(window);
