(() => {
    const D = window.AccountData;
    const $ = (id) => document.getElementById(id);

    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = (iso) => new Date(`${iso}T00:00:00`)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
    const initials = (u) => esc(u.slice(0, 2).toUpperCase());
    const empty = (text) => `<li class="empty-row">${esc(text)}</li>`;

    let say = () => {};

    // ---------- Shared pieces ----------
    function ticketCard(t, compact = false) {
        return `
      <article class="ticket ${esc(t.status)}">
        <div>
          <h3>${esc(t.movie)}</h3>
          <p class="muted small">${esc(t.cinema)} · ${esc(t.when)} · Seats ${esc(t.seats.join(', '))}</p>
        </div>
        <div class="ticket-side">
          <span class="status ${esc(t.status)}">${esc(t.status)}</span>
          ${compact ? '' : `<span class="muted small">${D.money(t.total)}</span>`}
          <code class="code-ref">${esc(t.id)}</code>
        </div>
      </article>`;
    }

    function giftItem(g, who) {
        return `
      <li class="item">
        <div class="item-head">
          <strong>${D.money(g.cents)}</strong>
          <span class="muted small">${esc(who)}</span>
        </div>
        ${g.message ? `<p>${esc(g.message)}</p>` : ''}
        <span class="muted small">${fmt(g.date)}</span>
      </li>`;
    }

    // ---------- Overview ----------
    function renderOverview() {
        const s = D.state;
        const lv = D.levelFor(s.points);
        const active = s.tickets.find((t) => t.status === 'upcoming');

        $('ov-level').innerHTML = `
      <div>
        <span class="level-badge lvl-${lv.current.key}">${esc(lv.current.name)}</span>
        <p class="big-num">${s.points} <span class="muted small">member points</span></p>
        <div class="meter"><i style="width:${lv.progress}%"></i></div>
        <p class="muted small">${lv.next ? `${lv.toNext} points to ${esc(lv.next.name)}` : 'Highest level reached'}</p>
      </div>
      <p class="muted small perk">Perk: ${esc(lv.current.perk)}</p>`;

        $('ov-stats').innerHTML = [
            ['Wallet', D.money(s.walletCents), 'wallet'],
            ['Tickets', String(s.tickets.length), 'tickets'],
            ['Friends', String(s.friends.length), 'friends'],
            ['Gifts received', String(s.gifts.received.length), 'gifts'],
        ].map(([label, value, go]) => `
      <button type="button" class="stat" data-go="${go}">
        <span class="muted small">${esc(label)}</span>
        <strong>${esc(value)}</strong>
      </button>`).join('');

        $('ov-active').innerHTML = active
            ? ticketCard(active, true)
            : '<p class="muted">No upcoming tickets. <a href="/movies">Browse movies</a> to book one.</p>';

        $('ov-activity').innerHTML = s.log.slice(0, 6)
            .map((t) => `<li class="item">${esc(t)}</li>`).join('') || empty('No activity yet.');
    }

    // ---------- Comments ----------
    function renderComments() {
        $('comment-list').innerHTML = D.state.comments.map((c) => `
      <li class="item">
        <div class="item-head">
          <strong>${esc(c.movie)}</strong>
          <span class="stars" aria-label="${c.rating} of 5 stars">${stars(c.rating)}</span>
        </div>
        <p>${esc(c.text)}</p>
        <div class="item-foot">
          <span class="muted small">${fmt(c.date)}</span>
          <button type="button" class="link-btn" data-delete-comment="${c.id}">Delete</button>
        </div>
      </li>`).join('') || empty('You have not written any comments yet.');
    }

    // ---------- Tickets ----------
    function renderTickets() {
        $('ticket-list').innerHTML = D.state.tickets.map((t) => ticketCard(t)).join('')
            || empty('No tickets yet. Book a movie to see it here.');
    }

    // ---------- Friends ----------
    function renderFriends() {
        const s = D.state;

        $('friend-list').innerHTML = s.friends.map((u) => `
      <li class="item row">
        <span class="user-chip">${initials(u)}</span>
        <span class="grow">@${esc(u)}</span>
        <button type="button" class="btn-small ghost" data-unfollow="${esc(u)}">Unfollow</button>
      </li>`).join('') || empty('You are not following anyone yet.');

        $('suggest-list').innerHTML = s.suggestions.map((u) => `
      <li class="item row">
        <span class="user-chip">${initials(u)}</span>
        <span class="grow">@${esc(u)}</span>
        <button type="button" class="btn-small" data-follow="${esc(u)}">Follow</button>
      </li>`).join('') || empty('No suggestions right now.');

        // Gifts can only go to people you follow, so the same list feeds the gift form.
        $('gift-to').innerHTML = s.friends.map((u) => `<option value="${esc(u)}">@${esc(u)}</option>`).join('')
            || '<option value="">Follow someone first</option>';
    }

    // ---------- Gifts ----------
    function renderGifts() {
        const g = D.state.gifts;
        $('gift-received').innerHTML = g.received.map((x) => giftItem(x, `From @${x.from}`)).join('')
            || empty('No gifts received yet.');
        $('gift-sent').innerHTML = g.sent.map((x) => giftItem(x, `To @${x.to}`)).join('')
            || empty('You have not sent any gifts.');
    }

    // ---------- Wallet ----------
    function renderWallet() {
        const s = D.state;
        $('wallet-balance').textContent = D.money(s.walletCents);
        $('wallet-tx').innerHTML = s.walletTx.map((t) => `
      <li class="item row">
        <span class="grow">${esc(t.label)}<br><span class="muted small">${fmt(t.date)}</span></span>
        <strong class="${t.cents < 0 ? 'neg' : 'pos'}">
          ${t.cents < 0 ? '−' : '+'}${D.money(Math.abs(t.cents))}
        </strong>
      </li>`).join('') || empty('No transactions yet.');
    }

    // ---------- Levels ----------
    function renderLevels() {
        const lv = D.levelFor(D.state.points);

        $('level-current').innerHTML = `
      <h2>Your level</h2>
      <span class="level-badge lvl-${lv.current.key}">${esc(lv.current.name)}</span>
      <p class="big-num">${D.state.points} points</p>
      <div class="meter"><i style="width:${lv.progress}%"></i></div>
      <p class="muted small">${lv.next
            ? `${lv.toNext} points until ${esc(lv.next.name)}.`
            : 'You have reached the highest level.'}</p>`;

        $('level-table').innerHTML = D.LEVELS.map((l) => `
      <li class="item row${l.key === lv.current.key ? ' on' : ''}">
        <span class="level-badge lvl-${l.key}">${esc(l.name)}</span>
        <span class="grow muted small">${l.min}+ points</span>
        <span class="small">${esc(l.perk)}</span>
      </li>`).join('');

        $('earn-table').innerHTML = [
            ['Write a comment', D.POINTS.comment],
            ['Book a ticket', D.POINTS.ticket],
            ['Send a gift', D.POINTS.giftSent],
            ['Follow a member', D.POINTS.follow],
        ].map(([what, pts]) => `
      <li class="item row">
        <span class="grow">${esc(what)}</span>
        <strong>+${pts}</strong>
      </li>`).join('');
    }

    // ---------- Public API ----------
    let me = null;

    function renderAll(user) {
        me = user;
        renderOverview();
        renderComments();
        renderTickets();
        renderFriends();
        renderGifts();
        renderWallet();
        renderLevels();
    }

    function refresh() {
        renderAll(me);
    }

    function setMovies(titles) {
        $('comment-movie').innerHTML = '<option value="">Choose a movie</option>' +
            titles.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    }

    function init(options) {
        say = options.say;

        // Comments
        $('comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const movie = form.elements.namedItem('movie').value;
            const rating = Number(form.elements.namedItem('rating').value);
            const text = form.elements.namedItem('text').value.trim();

            if (!movie) return say('Choose a movie first.', 'error');
            if (text.length < 3) return say('Write at least 3 characters.', 'error');

            D.addComment({ movie, rating, text });
            form.reset();
            say(`Comment posted. +${D.POINTS.comment} points`, 'success');
            refresh();
        });

        $('comment-list').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-delete-comment]');
            if (!btn) return;
            D.deleteComment(Number(btn.dataset.deleteComment));
            say('Comment deleted.', 'success');
            refresh();
        });

        // Friends
        $('add-friend-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const username = form.elements.namedItem('username').value.trim().toLowerCase();

            if (!/^[a-z0-9_]{3,30}$/.test(username)) {
                return say('Usernames are 3 to 30 letters, digits or underscores.', 'error');
            }
            if (D.state.friends.includes(username)) {
                return say(`You already follow @${username}.`, 'error');
            }
            if (!D.state.suggestions.includes(username)) {
                return say(`No member called @${username} in this demo.`, 'error');
            }

            D.follow(username);
            form.reset();
            say(`You now follow @${username}. +${D.POINTS.follow} points`, 'success');
            refresh();
        });

        $('suggest-list').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-follow]');
            if (!btn) return;
            D.follow(btn.dataset.follow);
            say(`You now follow @${btn.dataset.follow}. +${D.POINTS.follow} points`, 'success');
            refresh();
        });

        $('friend-list').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-unfollow]');
            if (!btn) return;
            D.unfollow(btn.dataset.unfollow);
            say(`You unfollowed @${btn.dataset.unfollow}.`, 'success');
            refresh();
        });

        // Gifts
        $('gift-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const to = form.elements.namedItem('to').value;
            const dollars = Number(form.elements.namedItem('amount').value);
            const message = form.elements.namedItem('message').value.trim();

            if (!to) return say('Follow someone before sending a gift.', 'error');
            if (!Number.isFinite(dollars) || dollars <= 0) return say('Enter an amount.', 'error');

            const cents = Math.round(dollars * 100);   // dollars typed by the user -> whole cents
            const res = D.sendGift({ to, cents, message });
            if (!res.ok) return say(res.message, 'error');

            form.reset();
            say(`Gift of ${D.money(cents)} sent to @${to}.`, 'success');
            refresh();
        });

        // Wallet
        function addMoney(cents, form) {
            const res = D.topUp(cents);
            if (!res.ok) return say(res.message, 'error');
            if (form) form.reset();
            say(`${D.money(cents)} added to your wallet (demo).`, 'success');
            refresh();
        }

        document.querySelectorAll('[data-topup]').forEach((btn) => {
            btn.addEventListener('click', () => addMoney(Number(btn.dataset.topup) * 100));
        });

        $('topup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const dollars = Number(e.currentTarget.elements.namedItem('amount').value);
            addMoney(Math.round(dollars * 100), e.currentTarget);
        });
    }

    window.AccountSections = { init, renderAll, setMovies };
})();