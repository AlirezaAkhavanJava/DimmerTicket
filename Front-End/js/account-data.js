/*
 * MOCK DATA for the account pages.
 * It lives in the browser and resets on reload. Each function below marks where a
 * server call will go later. Money is stored in cents (whole numbers) because
 * decimal floats such as 0.1 + 0.2 are not exact.
 */
window.AccountData = (() => {
    const LEVELS = [
        { key: 'bronze',   name: 'Bronze',   min: 0,    perk: 'Booking fee waived on weekday shows' },
        { key: 'silver',   name: 'Silver',   min: 200,  perk: '10% off snacks at the counter' },
        { key: 'gold',     name: 'Gold',     min: 500,  perk: 'One free seat upgrade per month' },
        { key: 'platinum', name: 'Platinum', min: 1000, perk: 'Early access to premieres' },
    ];

    // Points per action. The server decides these values, never the browser.
    const POINTS = { comment: 10, ticket: 50, giftSent: 5, follow: 20 };

    function levelFor(points) {
        let index = 0;
        LEVELS.forEach((lvl, i) => { if (points >= lvl.min) index = i; });

        const current = LEVELS[index];
        const next = LEVELS[index + 1] || null;
        const progress = next
            ? Math.round(((points - current.min) / (next.min - current.min)) * 100)
            : 100;

        return { current, next, progress, toNext: next ? next.min - points : 0 };
    }

    const money = (cents) => `$${(cents / 100).toFixed(2)}`;
    const today = () => new Date().toISOString().slice(0, 10);

    let nextId = 100;

    const state = {
        points: 340,
        walletCents: 2500,
        walletTx: [
            { id: 1, date: '2026-10-18', label: 'Welcome credit', cents: 2500 },
        ],
        comments: [
            { id: 1, movie: 'Dune: Part Two', rating: 5, text: 'Visually stunning. The sound design alone is worth the ticket.', date: '2026-10-19' },
        ],
        tickets: [
            { id: 'DT-7KQ2-9XM1', movie: 'Dune: Part Two', cinema: 'AMC Empire 25',
                when: '2026-10-24 17:00', seats: ['A5', 'A6'], total: 2800, status: 'upcoming' },
            { id: 'DT-2HB8-PL4N', movie: 'Barbie', cinema: 'Regal Times Square',
                when: '2026-09-12 19:30', seats: ['C4'], total: 1600, status: 'used' },
            { id: 'DT-9ZT1-QW7R', movie: 'Oppenheimer', cinema: 'AMC Empire 25',
                when: '2026-08-02 13:45', seats: ['D9'], total: 1400, status: 'cancelled' },
        ],
        friends: ['sara_test'],
        suggestions: ['plain_user', 'movie_fan'],
        gifts: {
            sent: [{ id: 1, to: 'sara_test', cents: 1000, message: 'Enjoy the movie!', date: '2026-10-15' }],
            received: [{ id: 2, from: 'plain_user', cents: 500, message: 'Popcorn is on me', date: '2026-10-17' }],
        },
        log: ['Joined DimmerTick', 'Commented on Dune: Part Two'],
    };

    function log(text) {
        state.log.unshift(`${today()} · ${text}`);
        state.log = state.log.slice(0, 20);
    }

    function addPoints(n) {
        state.points += n;
    }

    // POST /api/account/wallet/top-up  (later: a payment provider handles the charge)
    function topUp(cents) {
        if (!Number.isInteger(cents) || cents < 100 || cents > 50000) {
            return { ok: false, message: 'Enter an amount between $1 and $500.' };
        }
        state.walletCents += cents;
        state.walletTx.unshift({ id: nextId++, date: today(), label: 'Top-up (demo)', cents });
        log(`Added ${money(cents)} to wallet`);
        return { ok: true };
    }

    // Internal: every wallet debit goes through here, so the balance can never go negative.
    function spend(cents, label) {
        if (state.walletCents < cents) {
            return { ok: false, message: `Not enough balance. You have ${money(state.walletCents)}.` };
        }
        state.walletCents -= cents;
        state.walletTx.unshift({ id: nextId++, date: today(), label, cents: -cents });
        return { ok: true };
    }

    // POST /api/account/comments
    function addComment({ movie, rating, text }) {
        state.comments.unshift({ id: nextId++, movie, rating, text, date: today() });
        addPoints(POINTS.comment);
        log(`Commented on ${movie}`);
        return { ok: true };
    }

    // DELETE /api/account/comments/{id}
    function deleteComment(id) {
        state.comments = state.comments.filter((c) => c.id !== id);
        return { ok: true };
    }

    // POST /api/account/friends/{username}
    function follow(username) {
        if (!state.friends.includes(username)) {
            state.friends.push(username);
            addPoints(POINTS.follow);
            log(`Followed @${username}`);
        }
        state.suggestions = state.suggestions.filter((u) => u !== username);
        return { ok: true };
    }

    // DELETE /api/account/friends/{username}
    function unfollow(username) {
        state.friends = state.friends.filter((u) => u !== username);
        if (!state.suggestions.includes(username)) state.suggestions.push(username);
        return { ok: true };
    }

    // POST /api/account/gifts
    function sendGift({ to, cents, message }) {
        if (!state.friends.includes(to)) {
            return { ok: false, message: 'You can only send gifts to people you follow.' };
        }
        if (!Number.isInteger(cents) || cents < 100) {
            return { ok: false, message: 'Gifts start at $1.' };
        }
        if (message.length > 200) {
            return { ok: false, message: 'Messages can be up to 200 characters.' };
        }

        const paid = spend(cents, `Gift to @${to}`);
        if (!paid.ok) return paid;

        state.gifts.sent.unshift({ id: nextId++, to, cents, message, date: today() });
        addPoints(POINTS.giftSent);
        log(`Sent a ${money(cents)} gift to @${to}`);
        return { ok: true };
    }

    return {
        LEVELS, POINTS, levelFor, money, state,
        addComment, deleteComment, topUp, follow, unfollow, sendGift,
    };
})();