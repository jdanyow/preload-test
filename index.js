addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    const cookie = request.headers.get('cookie') || '';
    const token = new URLSearchParams(cookie.trim().replace(/;\s*/g, '&')).get('token');
    const authenticated = token === 'xyz';
    switch (url.pathname) {
        case '/':
        case '/preload':
            event.respondWith(new Response(indexHtml(authenticated, true), {
                status: 200,
                headers: {
                    'content-type': 'text/html'
                }
            }));
            return;
        case '/no-preload':
            event.respondWith(new Response(indexHtml(authenticated, false), {
                status: 200,
                headers: {
                    'content-type': 'text/html'
                }
            }));
            return;
        case '/index.js':
            event.respondWith(new Response(bootstrap.toString() + '\n\nbootstrap();', {
                status: 200,
                headers: {
                    'content-type': 'application/javascript'
                }
            }));
            return;
        case '/api/recommendations':
            if (authenticated) {
                event.respondWith(new Response(JSON.stringify(recommendations), {
                    status: 200,
                    headers: {
                        'content-type': 'application/json'
                    }
                }));
                return;
            }
            event.respondWith(new Response(undefined, { status: 201 }));
            return;
        case '/api/auth/signin':
            event.respondWith(new Response(undefined, {
                status: 302,
                headers: {
                    location: request.headers.get('referer') || '/',
                    'set-cookie': `token=xyz; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 356}`
                }
            }));
            return;
        case '/api/auth/signout':
            event.respondWith(new Response(undefined, {
                status: 302,
                headers: {
                    location: request.headers.get('referer') || '/',
                    'set-cookie': 'token=deleted; Path=/; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
                }
            }));
            return;
        default:
            event.respondWith(new Response(undefined, { status: 404 }));
            return;
    }
});

function indexHtml(authenticated, preload) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>preload test</title>
  ${preload ? `<link rel="preload" as="fetch" href="/api/recommendations" type="application/json" mode="no-cors">` : ''}
  <script src="index.js" defer></script>
</head>
<body>
  <h1>Preload test</h1>
  ${authenticated ? `<a href="/api/auth/signout">Sign out</a>` : `<a href="/api/auth/signin">Sign in</a>`}
</body>
</html>`;
}

async function bootstrap() {
    const response = await fetch('/api/recommendations', { credentials: 'include', mode: 'no-cors' });
    if (response.status !== 200) {
        return;
    }
    const recommendations = await response.json();
    document.body.insertAdjacentHTML('beforeend', `
    <h2>Recommendations</h2>
    <ul>
        ${recommendations.map(({ title, url }) => `<li><a href="${url}">${title}</a></li>`)}
    </ul>`);
}

const recommendations = [
    { title: 'Azure', url: 'https://docs.microsoft.com/en-us/azure/' },
    { title: '.NET', url: 'https://docs.microsoft.com/en-us/dotnet/' }
];