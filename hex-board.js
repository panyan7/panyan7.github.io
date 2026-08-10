/**
 * Writings hex board — flat-top honeycomb (horizontal top/bottom).
 * Uses shared HexLayout for metrics + sidebar so positions match all pages.
 */
(function (global) {
    'use strict';

    var VIDEO_SRC = 'https://www.youtube-nocookie.com/embed/imBlPXbAv6E?rel=0&autoplay=1';

    /**
     * Lattice size (HexLayout metrics.size) = OUTER hex radius — neighbors share edges.
     * Inner ring on content blocks only: outer / INNER_RATIO (≈ 20% smaller).
     */
    var INNER_RATIO = 1.1;
    var HEX_STROKE = '#cccccc';

    var state = {
        blogs: [],
        content: [],
        playerExpanded: false,
        visible: true
    };

    function key(q, r) {
        return q + ',' + r;
    }

    function HL() {
        return global.HexLayout;
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

    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(value);
        }
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function isFree(q, r, reserved) {
        return !reserved[key(q, r)];
    }

    function neighbors(q, r) {
        return HL().neighbors(q, r);
    }

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
            // Never place content on the sidebar column q=0 (brand/nav stack)
            if (cur.q !== 0 && isFree(cur.q, cur.r, reserved)) {
                return { q: cur.q, r: cur.r };
            }
            neighbors(cur.q, cur.r).forEach(function (n) {
                if (!seen[key(n.q, n.r)]) queue.push(n);
            });
        }

        var origin = (seeds && seeds[0]) || { q: 2, r: 0 };
        for (var rad = 1; rad < 14; rad++) {
            for (var dq = -rad; dq <= rad; dq++) {
                for (var dr = -rad; dr <= rad; dr++) {
                    var qq = origin.q + dq;
                    var rr = origin.r + dr;
                    if (qq !== 0 && isFree(qq, rr, reserved)) {
                        return { q: qq, r: rr };
                    }
                }
            }
        }
        return { q: 2, r: 3 };
    }

    /**
     * Two free adjacent cells (bilingual block). Prefer horizontal (+1,0).
     */
    function findPairSlot(reserved, seeds) {
        var pairDirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]
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

            if (cur.q !== 0 && isFree(cur.q, cur.r, reserved)) {
                for (var d = 0; d < pairDirs.length; d++) {
                    var nq = cur.q + pairDirs[d][0];
                    var nr = cur.r + pairDirs[d][1];
                    if (nq === 0) continue;
                    if (isFree(nq, nr, reserved)) {
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

        var p = findSlot(reserved, seeds);
        for (var i = 0; i < pairDirs.length; i++) {
            var sq = p.q + pairDirs[i][0];
            var sr = p.r + pairDirs[i][1];
            if (sq !== 0 && isFree(sq, sr, reserved)) {
                return { primary: p, secondary: { q: sq, r: sr } };
            }
        }
        return { primary: p, secondary: { q: p.q + 1, r: p.r } };
    }

    /**
     * Content only (sidebar comes from HexLayout).
     * Layout is relative to sidebar column at q=0.
     */
    function placeContent(blogs) {
        var cells = [];
        var reserved = {};
        // Reserve sidebar column lattice cells so blogs don't land on them
        for (var rr = -2; rr <= 8; rr++) {
            reserved[key(0, rr)] = true;
        }

        var seeds = [];

        function take(q, r, data) {
            reserved[key(q, r)] = true;
            cells.push(Object.assign({ q: q, r: r }, data));
            seeds.push({ q: q, r: r });
        }

        // Title / intro to the right of sidebar
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

        var playerSlot = findSlot(reserved, blogSeed.concat(seeds.slice(-6)));
        take(playerSlot.q, playerSlot.r, {
            type: 'player',
            text: 'infinity repeating...'
        });

        return cells;
    }

    function cellBox(cell, m) {
        var c0 = HL().cellCenter(cell.q, cell.r, m);
        return {
            cx: c0.x,
            cy: c0.y,
            w: m.hexW,
            h: m.hexH
        };
    }

    /** Open path along flat-top hex perimeter (for stroke-dash animation). */
    function hexPerimeterPath(cx, cy, radius) {
        var pts = HL().hexCorners(cx, cy, radius);
        var d = 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2);
        for (var i = 1; i < pts.length; i++) {
            d += ' L ' + pts[i].x.toFixed(2) + ' ' + pts[i].y.toFixed(2);
        }
        d += ' Z';
        return d;
    }

    /**
     * Empty cell: solid outer only (lattice-adjacent).
     * Content cell: solid outer + smaller inner with 1/6 contour sweeping clockwise.
     */
    function hexCellSvg(cx, cy, outerR, fill, hasContent) {
        var outerPts = HL().pointsAttr(HL().hexCorners(cx, cy, outerR));
        var parts =
            '<g class="hex-cell' + (hasContent ? ' hex-cell--content' : '') + '">' +
            '<polygon class="hex-outer" points="' + outerPts +
            '" fill="' + fill +
            '" stroke="' + HEX_STROKE +
            '" stroke-width="1" stroke-linejoin="round"/>';

        if (hasContent) {
            var innerR = outerR / INNER_RATIO;
            var innerPath = hexPerimeterPath(cx, cy, innerR);
            parts +=
                '<path class="hex-inner-arc" d="' + innerPath +
                '" fill="none" stroke="' + HEX_STROKE +
                '" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round"' +
                ' pathLength="6"' +
                ' stroke-dasharray="1 5"/>';
        }

        parts += '</g>';
        return parts;
    }

    function render() {
        var board = document.getElementById('hex-board');
        if (!board || !state.visible || !HL()) return;

        HL().invalidate();
        var m = HL().mountSidebar({ activePage: 'writings.html' });

        var contentMap = {};
        state.content.forEach(function (c) {
            contentMap[key(c.q, c.r)] = c;
        });

        var range = HL().coverRange(m);
        var svgParts = [];
        var labelParts = [];
        var margin = m.size * 2;

        for (var q = range.minQ; q <= range.maxQ; q++) {
            for (var r = range.minR; r <= range.maxR; r++) {
                var c = HL().cellCenter(q, r, m);
                if (c.x < -margin || c.x > m.vw + margin ||
                    c.y < -margin || c.y > m.vh + margin) {
                    continue;
                }

                var cell = contentMap[key(q, r)];
                // Sidebar column: brand (0,0), Home|About (0,1), Writings|Photo (0,2)
                var isSidebarHex = (q === 0 && r >= 0 && r <= 2);
                var hasContent = !!cell || isSidebarHex;
                var fill = hasContent ? '#ffffff' : 'none';

                // m.size = outer radius; outers are lattice-adjacent
                // Inner sweep only on content blocks + sidebar hexes
                svgParts.push(hexCellSvg(c.x, c.y, m.size, fill, hasContent));

                if (cell) {
                    labelParts.push(renderLabel(cell, m));
                }
            }
        }

        board.innerHTML =
            '<svg class="hex-board-svg" width="' + m.vw + '" height="' + m.vh +
            '" viewBox="0 0 ' + m.vw + ' ' + m.vh + '" aria-hidden="true">' +
            svgParts.join('') +
            '</svg>' +
            '<div class="hex-labels">' + labelParts.join('') + '</div>';

        bindLabelEvents(board);
    }

    function renderLabel(cell, m) {
        var geo = cellBox(cell, m);
        var left = geo.cx - geo.w / 2;
        var top = geo.cy - geo.h / 2;
        var style =
            'left:' + left.toFixed(1) + 'px;top:' + top.toFixed(1) +
            'px;width:' + geo.w.toFixed(1) + 'px;height:' + geo.h.toFixed(1) + 'px;';

        var cls = 'hex-label hex-label--' + cell.type + ' hex-label--flat';
        if (cell.blockId) cls += ' hex-label--block';

        var inner = '';
        var playing = false;

        if (cell.type === 'title') {
            inner = '<span class="hex-label-text hex-label-text--title">' +
                escapeHtml(cell.text) + '</span>';
        } else if (cell.type === 'intro') {
            inner = '<span class="hex-label-text hex-label-text--intro">' +
                escapeHtml(cell.text) + '</span>';
        } else if (cell.type === 'blog') {
            var date = formatDateCondensed(cell.date);
            inner =
                '<a class="hex-label-link hex-label-link--blog" href="#' +
                escapeHtml(cell.filename) + '">' +
                '<span class="hex-label-date">' + escapeHtml(date) + '</span>' +
                '<span class="hex-label-text">' + escapeHtml(cell.text) + '</span>' +
                '</a>';
        } else if (cell.type === 'blog-en') {
            inner =
                '<a class="hex-label-link hex-label-link--blog hex-label-link--blog-en" href="#' +
                escapeHtml(cell.filename) + '">' +
                '<span class="hex-label-text hex-label-text--en">' +
                escapeHtml(cell.text) + '</span>' +
                '</a>';
        } else if (cell.type === 'player') {
            if (state.playerExpanded) {
                playing = true;
                cls += ' hex-label--playing';
                // Full-cell embed; parent label provides a single perfect flat-top clip
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

        if (playing) {
            return (
                '<div class="' + cls + '" style="' + style +
                '" data-type="' + cell.type + '">' +
                inner +
                '</div>'
            );
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
        // Keep sidebar visible and stable on post view
        if (HL()) {
            HL().mountSidebar({ activePage: 'writings.html' });
        }
    }

    function onLayoutChange() {
        if (state.visible) render();
    }

    global.HexBoard = {
        showList: showList,
        hideBoard: hideBoard,
        showPostPanel: showPostPanel,
        render: render,
        onLayoutChange: onLayoutChange
    };
})(window);
