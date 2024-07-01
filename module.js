import { API_URL } from './config.js';
import { TIMER_INTERVAL_SECONDS } from './config.js';

function getSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function getIp() {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    return ipData.ip;
}

function getUserAgent() {
    return navigator.userAgent;
}

function getScreenInfo() {
    return `${screen.width}x${screen.height}`;
}

function getWindowInfo() {
    return `${window.innerWidth}x${window.innerHeight}`;
}

function getDPI() {
    const div = document.createElement("div");
    div.style.width = "1in";
    div.style.position = "fixed";
    document.body.appendChild(div);
    const ppi = div.offsetWidth;
    document.body.removeChild(div);
    return ppi;
}

function getOSInfo() {
    return navigator.platform;
}

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

function getCookies() {
    return document.cookie.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.split('=').map(c => c.trim());
        cookies[name] = value;
        return cookies;
    }, {});
}

function getCurrentTime() {
    return new Date().getTime();
}

function getConnectTime() {
    const connectTime = new Date();
    return connectTime.toISOString();
}

function getCurrentPage() {
    return window.location.pathname.split("/").pop();
}

function updateNavigationHistory() {
    const currentPage = window.location.pathname.split("/").pop();
    let navigationHistory = sessionStorage.getItem("navigation_history");
    if (!navigationHistory) {
        navigationHistory = [];
    } else {
        navigationHistory = JSON.parse(navigationHistory);
    }
    navigationHistory.push(currentPage);
    sessionStorage.setItem("navigation_history", JSON.stringify(navigationHistory));
}

function updateExitTime() {
    let pageViews = sessionStorage.getItem("page_views");
    let exitTime = getCurrentTime();

    if (pageViews) {
        pageViews = JSON.parse(pageViews);
    } else {
        pageViews = [];
    }

    if (sessionStorage.getItem("current_page") && sessionStorage.getItem("entry_time")) {
        let currentPage = sessionStorage.getItem("current_page");
        let entryTime = parseInt(sessionStorage.getItem("entry_time"), 10);
        let timeSpent = Math.round((exitTime - entryTime) / 1000);

        let pageEntry = pageViews.find(entry => entry.page_url === currentPage);

        if (pageEntry) {
            pageEntry.time_spent += timeSpent;
        } else {
            pageViews.push({
                page_url: currentPage,
                time_spent: timeSpent
            });
        }
    }

    sessionStorage.setItem("page_views", JSON.stringify(pageViews));
}

function updateEntryTime() {
    let entryTime = getCurrentTime();
    let currentPage = window.location.pathname.split("/").pop();
    
    sessionStorage.setItem("entry_time", entryTime);
    sessionStorage.setItem("current_page", currentPage);
}

window.addEventListener('load', () => {
    updateExitTime();
    updateEntryTime();
    updateNavigationHistory();
});

window.addEventListener('beforeunload', () => {
    updateExitTime();
});

async function initLog() {
    sessionStorage.setItem("ip", await getIp());
    sessionStorage.setItem("user_agent", getUserAgent());
    sessionStorage.setItem("screen_resolution", getScreenInfo());
    sessionStorage.setItem("window_resolution", getWindowInfo());
    sessionStorage.setItem("DPI", getDPI());
    sessionStorage.setItem("OS", getOSInfo());
    sessionStorage.setItem("geo_position", JSON.stringify(await getGeolocation()));
    sessionStorage.setItem("cookies", JSON.stringify(getCookies()));
    if (!sessionStorage.getItem("connect_time")) {
        sessionStorage.setItem("connect_time", getConnectTime());
    }
    if (!sessionStorage.getItem("session_id")) {
        sessionStorage.setItem("session_id", getSessionId());
    }
    
}

function collectUserData() {
    const disconnect_time = new Date();

    const userData = {
        ip_address: sessionStorage.getItem("ip") || null,
        user_agent: sessionStorage.getItem("user_agent") || null,
        screen_resolution: sessionStorage.getItem("screen_resolution") || null,
        window_resolution: sessionStorage.getItem("window_resolution") || null,
        dots_per_inch: parseInt(sessionStorage.getItem("DPI")) || null,
        os_info: sessionStorage.getItem("OS") || null,
        geo_position: JSON.parse(sessionStorage.getItem("geo_position")),
        cookies: JSON.parse(sessionStorage.getItem("cookies")) || null,
        connect_time: sessionStorage.getItem("connect_time") || null,
        disconnect_time: disconnect_time.toISOString(),
        page_views: JSON.parse(sessionStorage.getItem("page_views")) || null,
        navigation_history: JSON.parse(sessionStorage.getItem("navigation_history")) || null,
        session_id: sessionStorage.getItem("session_id")
    }
    console.log(userData); // debug
    return userData;
}

function clearStorage() {
    sessionStorage.removeItem("ip");
    sessionStorage.removeItem("user_agent");
    sessionStorage.removeItem("screen_resolution");
    sessionStorage.removeItem("window_resolution");
    sessionStorage.removeItem("DPI");
    sessionStorage.removeItem("OS");
    sessionStorage.removeItem("geo_position");
    sessionStorage.removeItem("cookies");
    sessionStorage.removeItem("connect_time");
    sessionStorage.removeItem("page_views");
    sessionStorage.removeItem("navigation_history");
}

async function sendUserData() {
    const user_data = collectUserData();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user_data)
        });
    } catch (error) {
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            console.error('Error sending data: connection refused');
        } else {
            console.error('Error sending data:', error.message);
        }
    }

    clearStorage();
    initLog();
}

initLog();

setTimeout(() => {
    sendUserData();
    setInterval(sendUserData, TIMER_INTERVAL_SECONDS * 1000);
}, TIMER_INTERVAL_SECONDS * 1000);
