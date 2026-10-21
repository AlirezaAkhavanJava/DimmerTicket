(() => {
    const DEFAULT = 'avatar-01';

    const CATALOG = {
        'avatar-01': { label: 'Sunset', from: '#ff9a3c', to: '#ff5e62', face: 'smile' },
        'avatar-02': { label: 'Ocean',  from: '#36d1dc', to: '#5b86e5', face: 'cool' },
        'avatar-03': { label: 'Forest', from: '#56ab2f', to: '#a8e063', face: 'smile' },
        'avatar-04': { label: 'Berry',  from: '#c471ed', to: '#f64f59', face: 'wink' },
        'avatar-05': { label: 'Gold',   from: '#f7971e', to: '#ffd200', face: 'cool' },
        'avatar-06': { label: 'Night',  from: '#232526', to: '#414345', face: 'wink' },
        'avatar-07': { label: 'Mint',   from: '#00b09b', to: '#96c93d', face: 'smile' },
        'avatar-08': { label: 'Cloud',  from: '#8e9eab', to: '#eef2f3', face: 'cool' },
    };

    const FACES = {
        smile: '<circle cx="28" cy="26" r="1.8" fill="#222"/><circle cx="36" cy="26" r="1.8" fill="#222"/>' +
            '<path d="M28 30q4 3 8 0" stroke="#222" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
        cool:  '<rect x="23" y="23" width="8" height="5" rx="2" fill="#222"/>' +
            '<rect x="33" y="23" width="8" height="5" rx="2" fill="#222"/>' +
            '<path d="M28 31h8" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>',
        wink:  '<path d="M24 26q2.5-2.5 5 0" stroke="#222" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
            '<circle cx="37" cy="26" r="1.8" fill="#222"/>' +
            '<path d="M28 30q4 3 8 0" stroke="#222" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    };

    let uid = 0;

    function svg(key) {
        const a = CATALOG[key] || CATALOG[DEFAULT];
        const id = `avatar-grad-${++uid}`;
        return `<svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-label="${a.label} avatar">
            <defs>
                <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="${a.from}"/>
                    <stop offset="1" stop-color="${a.to}"/>
                </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="32" fill="url(#${id})"/>
            <circle cx="32" cy="27" r="11" fill="#fff" fill-opacity=".92"/>
            <path d="M14 58c3-11 11-16 18-16s15 5 18 16" fill="#fff" fill-opacity=".92"/>
            ${FACES[a.face]}
        </svg>`;
    }

    window.AvatarArt = {
        DEFAULT,
        keys: Object.keys(CATALOG),
        label: (key) => (CATALOG[key] || CATALOG[DEFAULT]).label,
        svg,
        render(el, key) {
            el.innerHTML = svg(key);
        },
    };
})();