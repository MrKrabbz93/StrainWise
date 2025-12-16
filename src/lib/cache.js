export const clearAppCache = async () => {
    // Clear LocalStorage
    localStorage.clear();

    // Clear SessionStorage
    sessionStorage.clear();

    // Clear Caches API (Service Workers)
    if ('caches' in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
        } catch (err) {
            console.error("Failed to clear caches:", err);
        }
    }

    console.log("App cache and storage cleared.");
};
