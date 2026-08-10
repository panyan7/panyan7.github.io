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
            text: 'This is a collection of random, useless, and often unfinished thoughts.'
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
