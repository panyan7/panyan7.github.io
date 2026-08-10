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

    /**
     * User grid (1-based): row 1 col 1 = Yan Pan.
     * Same row number ⇒ same horizontal line on screen (flat-top even-q offset).
     *
     *   q = col - 1
     *   r = (row - 1) - floor((col - 1) / 2)   // even-q → axial
     *     (equiv. r = row0 - (col0 - (col0&1)) / 2)
     */
    function userToAxial(col, row) {
        var c = col - 1;
        var ro = row - 1;
        var q = c;
        var r = ro - (c - (c & 1)) / 2;
        return { q: q, r: r };
    }

    /**
     * Fixed: r2c3 title, r3c3 intro, r4c3 player; r4c1 pagination later.
     * Articles: allowed region, fill top→bottom then left→right (user row, then col).
     */
    function placeContent(blogs) {
        var cells = [];
        var reserved = {};

        function takeUser(col, row, data) {
            var p = userToAxial(col, row);
            reserved[key(p.q, p.r)] = true;
            cells.push(Object.assign({ q: p.q, r: p.r }, data));
        }

        // Sidebar column q=0 (Yan / nav / pagination at user r4c1)
        for (var rr = -2; rr <= 8; rr++) {
            reserved[key(0, rr)] = true;
        }

        takeUser(3, 2, {
            type: 'title',
            text: 'The Library of Babel'
        });
        takeUser(3, 3, {
            type: 'intro',
            text: 'A collection of random, useless, and often unfinished thoughts...'
        });
        takeUser(3, 4, {
            type: 'player',
            text: 'infinity repeating...'
        });

        // User (col, row), top→bottom then left→right
        // col2: rows1–4 | col3: rows1,5 | col4: rows1–4 | col5: rows2–4
        var articleUserSlots = [
            [2, 1], [3, 1], [4, 1],
            [2, 2], [4, 2], [5, 2],
            [2, 3], [4, 3], [5, 3],
            [2, 4], [4, 4], [5, 4],
            [3, 5]
        ];

        var si = 0;
        for (var i = 0; i < blogs.length; i++) {
            while (si < articleUserSlots.length) {
                var ax = userToAxial(
                    articleUserSlots[si][0],
                    articleUserSlots[si][1]
                );
                if (!reserved[key(ax.q, ax.r)]) break;
                si++;
            }
            if (si >= articleUserSlots.length) break;
            var b = blogs[i];
            var slot = articleUserSlots[si++];
            takeUser(slot[0], slot[1], {
                type: 'blog',
                text: b.title,
                date: b.date,
                filename: b.filename
            });
        }

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

    /** Cube distance between axial cells (for empty-hex fade). */
    function axialDistance(q, r, q0, r0) {
        var dq = q - q0;
        var dr = r - r0;
        var ds = (-q - r) - (-q0 - r0);
        return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
    }

    /**
     * Empty cells: dashed outer. Distance = cube steps from nearest content/sidebar
     * cell. Dash length + opacity fall off gradually; gone by EMPTY_FADE_DIST.
     * Content cells: solid outer + animated inner arc.
     */
    var EMPTY_FADE_DIST = 9; // fully gone this many steps from the filled cluster

    function minDistToFilled(q, r, filledList) {
        var minD = Infinity;
        for (var i = 0; i < filledList.length; i++) {
            var f = filledList[i];
            var d = axialDistance(q, r, f.q, f.r);
            if (d < minD) minD = d;
        }
        return minD;
    }

    function hexCellSvg(cx, cy, outerR, fill, hasContent, emptyDist) {
        var outerPts = HL().pointsAttr(HL().hexCorners(cx, cy, outerR));

        if (hasContent) {
            var innerR = outerR / INNER_RATIO;
            var innerPath = hexPerimeterPath(cx, cy, innerR);
            return (
                '<g class="hex-cell hex-cell--content">' +
                '<polygon class="hex-outer" points="' + outerPts +
                '" fill="' + fill +
                '" stroke="' + HEX_STROKE +
                '" stroke-width="1" stroke-linejoin="round"/>' +
                '<path class="hex-inner-arc" d="' + innerPath +
                '" fill="none" stroke="' + HEX_STROKE +
                '" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round"' +
                ' pathLength="6"' +
                ' stroke-dasharray="1 5"/>' +
                '</g>'
            );
        }

        // Empty: skip only past the fade horizon
        if (emptyDist >= EMPTY_FADE_DIST) {
            return '';
        }

        // Neighbors of content (dist 1) are strongest; fade linearly to the horizon
        var t = (emptyDist - 1) / (EMPTY_FADE_DIST - 1);
        if (t < 0) t = 0;
        if (t > 1) t = 1;

        // pathLength units (perimeter = 6): long dashes near, short far, gap grows
        var dashOn = 0.65 * (1 - t) + 0.12 * t;       // ~0.65 → ~0.12
        var dashOff = 0.18 * (1 - t) + 0.75 * t;      // ~0.18 → ~0.75
        var opacity = 0.9 * (1 - t) + 0.12 * t;       // stay readable longer

        var emptyPath = hexPerimeterPath(cx, cy, outerR);
        return (
            '<g class="hex-cell hex-cell--empty" opacity="' + opacity.toFixed(3) + '">' +
            '<path class="hex-outer-dashed" d="' + emptyPath +
            '" fill="none" stroke="' + HEX_STROKE +
            '" stroke-width="1" stroke-linejoin="round" stroke-linecap="butt"' +
            ' pathLength="6"' +
            ' stroke-dasharray="' + dashOn.toFixed(3) + ' ' + dashOff.toFixed(3) + '"/>' +
            '</g>'
        );
    }

    function render() {
        var board = document.getElementById('hex-board');
        if (!board || !state.visible || !HL()) return;

        HL().invalidate();
        var m = HL().mountSidebar({ activePage: 'writings.html', showDividers: true });

        var contentMap = {};
        var filledList = [];
        state.content.forEach(function (c) {
            contentMap[key(c.q, c.r)] = c;
            filledList.push({ q: c.q, r: c.r });
        });
        // Sidebar hexes count as filled for the empty-field fade
        filledList.push({ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 });

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
                var emptyDist = hasContent ? 0 : minDistToFilled(q, r, filledList);

                svgParts.push(
                    hexCellSvg(c.x, c.y, m.size, fill, hasContent, emptyDist)
                );

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
        // Keep sidebar visible and stable; no hex pair dividers on article view
        if (HL()) {
            HL().mountSidebar({ activePage: 'writings.html', showDividers: false });
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
