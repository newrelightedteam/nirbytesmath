async function uvEncode(url) {
    const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
    localStorage.setItem("url", encodedUrl);
    window.location.href = "/search";
}

async function sjEncode(url) {
    const encodedUrl = "/scram/service/" + encodeURIComponent(url);
    localStorage.setItem("url", encodedUrl);
    window.location.href = "/search";
}

async function init() {
    try {
        const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
        let transport = localStorage.getItem("transport") || "libcurl";
        localStorage.setItem("transport", transport);
        let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (localStorage.getItem("wisp-server-type") === "custom") {
            const customWisp = localStorage.getItem("wisp");
            if (customWisp) wispUrl = customWisp;
        } else {
            localStorage.setItem("wisp", wispUrl);
        }
        const transportPath = transport === "epoxy" ? "/epoxy/index.mjs" : "/libcurl/index.mjs";
        if (await connection.getTransport() !== transportPath) {
            await connection.setTransport(transportPath, [{ wisp: wispUrl }]);
        }
    } catch (err) {
        console.error(err);
    }

    try {
        const { ScramjetController } = $scramjetLoadController();
        const scramjet = new ScramjetController({
            prefix: "/scram/service/",
            files: {
                wasm: "/scram/scramjet.wasm.wasm",
                all: "/scram/scramjet.all.js",
                sync: "/scram/scramjet.sync.js"
            },
            flags: {
                syncxhr: true
            }
        });
        window.sj = scramjet;
        await scramjet.init();
    } catch (error) {
        console.error(error);
    }
}

function resetSiteData() {
    if (confirm("Reset all settings, custom apps, and site data?")) {
        localStorage.clear();
        if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let r of registrations) r.unregister();
            });
        }
        window.location.reload();
    }
}

if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length === 0) {
            navigator.serviceWorker.register("sw.js").catch(err => console.error(err));
        }
    });
}


const encodeURL = async (url) => {
    let proxyType = localStorage.getItem('proxy') || 'ultraviolet';
    proxyType === 'ultraviolet' ? await uvEncode(url) : await sjEncode(url);
};


const handleSearch = async (q) => {
    const query = q || null;
    if (!query) return;
    let url;
    let isLikelySearch = false;
    try {
        url = (query.startsWith('http://') || query.startsWith('https://')) ? new URL(query) : new URL('https://' + query);
        if (!url.hostname || !url.hostname.includes('.')) isLikelySearch = true;
    } catch (e) {
        isLikelySearch = true;
    }
    if (isLikelySearch) url = new URL((localStorage.getItem('search') || 'https://www.google.com/search?q=') + query);
    await encodeURL(url.toString());
};