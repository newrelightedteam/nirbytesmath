importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts('/uv/uv.sw.js');
importScripts("/scram/scramjet.all.js");

const uv = new UVServiceWorker();
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

const configPromise = scramjet.loadConfig();

self.addEventListener("message", ({ data }) => {
    if (data.type === "playgroundData") {
        playgroundData = data;
    }
});

async function handleRequest(event) {
    if (uv.route(event)) {
        return await uv.fetch(event);
    }

    await configPromise;
    if (scramjet.route(event)) {
        return await scramjet.fetch(event);
    }

    return await fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(
        handleRequest(event).catch((err) => {
            console.error("SW Fetch Error:", err);
            return fetch(event.request);
        })
    );
});
