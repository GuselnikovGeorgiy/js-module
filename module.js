import { API_URL } from './config.js';

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
    let pageTimeView = sessionStorage.getItem("page_views");
    let exitTime = getCurrentTime();

    if (pageTimeView) {
        pageTimeView = JSON.parse(pageTimeView);
    } else {
        pageTimeView = [];
    }

    if (sessionStorage.getItem("current_page") && sessionStorage.getItem("entry_time")) {
        let currentPage = sessionStorage.getItem("current_page");
        let entryTime = parseInt(sessionStorage.getItem("entry_time"), 10);
        let timeSpent = Math.round((exitTime - entryTime) / 1000 / 2);

        let pageEntry = pageTimeView.find(entry => entry[currentPage]);

        if (pageEntry) {
            pageEntry[currentPage] += timeSpent;
        } else {
            let newEntry = {};
            newEntry[currentPage] = timeSpent;
            pageTimeView.push(newEntry);
        }
    }

    sessionStorage.setItem("page_views", JSON.stringify(pageTimeView));
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
    //collectUserData();
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
    sessionStorage.setItem("connect_time", getConnectTime());
}


initLog();

function collectUserData() {
    const disconnect_time = new Date();

    const userData = {
        ip_address: sessionStorage.getItem("ip") || null,
        user_agent: sessionStorage.getItem("user_agent") || null,
        screen_resolution: sessionStorage.getItem("screen_resolution") || null,
        window_resolution: sessionStorage.getItem("window_resolution") || null,
        pixels_per_inch: sessionStorage.getItem("DPI") || null,
        os_info: sessionStorage.getItem("OS") || null,
        geo_position: sessionStorage.getItem("geo_location") || null,
        cookies: sessionStorage.getItem("cookies") || null,
        connect_time: sessionStorage.getItem("connect_time") || null,
        disconnect_time: disconnect_time.toISOString(),
        page_views: sessionStorage.getItem("page_views"),
        navigation_history: sessionStorage.getItem("navigation_history")
    }

    //console.log(userData);
    return userData;
}

async function sendUserData() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectUserData())
        });
        if (!response.ok) {
            console.error('Failed to send data:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending data:', error);
    }
}
