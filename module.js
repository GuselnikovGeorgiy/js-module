import { API_URL } from './config.js';

function getCookies() {
    return document.cookie.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.split('=').map(c => c.trim());
        cookies[name] = value;
        return cookies;
    }, {});
}

// Function to get geolocation
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                () => resolve(null)
            );
        } else {
            resolve(null);
        }
    });
}

// Function to get pixels per inch (PPI)
function getPPI() {
    const div = document.createElement("div");
    div.style.width = "1in";
    div.style.position = "fixed";
    document.body.appendChild(div);
    const ppi = div.offsetWidth;
    document.body.removeChild(div);
    return ppi;
}

// Initialize data collection
async function collectUserData() {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const ip = ipData.ip;

    const connectTime = new Date();

    const userData = {
        ip_address: ip || null,
        user_agent: navigator.userAgent || null,
        screen_resolution: `${screen.width}x${screen.height}` || null,
        window_resolution: `${window.innerWidth}x${window.innerHeight}` || null,
        pixels_per_inch: getPPI() || null,
        os_info: navigator.platform || null,
        geo_position: await getGeolocation() || null,
        cookies: getCookies() || null,
        connect_time: connectTime.toISOString() || null,
        disconnect_time: null,
        page_views: [],
        navigation_history: []
    };

    let currentPageStart = new Date();
    let currentUrl = location.href;

    userData.navigation_history.push(currentUrl);

    window.addEventListener('beforeunload', () => {
        const disconnectTime = new Date();
        userData.disconnect_time = disconnectTime.toISOString();
        userData.page_views.push({
            page_url: currentUrl,
            time_spent: Math.round((disconnectTime - currentPageStart) / 1000)
        });

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        }).catch(() => {});
    });

    window.addEventListener('popstate', () => {
        const currentPageEnd = new Date();
        userData.page_views.push({
            page_url: currentUrl,
            time_spent: Math.round((currentPageEnd - currentPageStart) / 1000)
        });

        currentUrl = location.href;
        currentPageStart = new Date();
        userData.navigation_history.push(currentUrl);
    });

    window.addEventListener('pushstate', () => {
        const currentPageEnd = new Date();
        userData.page_views.push({
            page_url: currentUrl,
            time_spent: Math.round((currentPageEnd - currentPageStart) / 1000)
        });

        currentUrl = location.href;
        currentPageStart = new Date();
        userData.navigation_history.push(currentUrl);
    });

    history.pushState = ((f) => function pushState() {
        const ret = f.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        return ret;
    })(history.pushState);
}

collectUserData();
