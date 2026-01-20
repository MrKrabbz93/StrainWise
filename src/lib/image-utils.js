/**
 * Resizes and compresses an image file to a lightweight JPEG Data URL.
 * Useful for avatars and thumbnails.
 * @param {File} file - The input image file.
 * @param {number} maxWidth - Maximum width (default 200px).
 * @param {number} quality - JPEG quality (0.0 to 1.0, default 0.6).
 * @returns {Promise<string>} - The base64 Data URL.
 */
export const processImageForAvatar = (file, maxWidth = 200, quality = 0.6) => {
    return new Promise((resolve, reject) => {
        if (!file) return reject("No file provided");

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const elem = document.createElement('canvas');
                // Calculate aspect ratio
                const scaleFactor = maxWidth / img.width;
                const width = maxWidth;
                const height = img.height * scaleFactor;

                elem.width = width;
                elem.height = height;

                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export
                const dataUrl = elem.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };

            img.onerror = (err) => reject(new Error("Failed to load image for processing"));
        };

        reader.onerror = (err) => reject(new Error("File reading failed"));
    });
};
