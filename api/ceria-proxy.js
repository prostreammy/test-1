<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Astro Ceria - Live</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/shaka-player@4.7.0/dist/controls.css">
    <script src="https://cdn.jsdelivr.net/npm/shaka-player@4.7.0/dist/shaka-player.ui.js"></script>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
        .video-container { width: 100%; max-width: 900px; aspect-ratio: 16/9; }
        video { width: 100%; height: 100%; }
    </style>
</head>
<body>

<div class="video-container" data-shaka-player-container>
    <video id="video" data-shaka-player-video autoplay></video>
</div>

<script>
    async function initApp() {
        shaka.polyfill.installAll();

        const video = document.getElementById('video');
        const player = new shaka.Player(); // Removed 'video' from constructor
        
        // 1. New way to attach video element (Fixes deprecation warning)
        await player.attach(video);

        // 2. Configure DRM with Robustness (Fixes warnings)
        player.configure({
            drm: {
                servers: {
                    // This URL might need to be proxied if geoblocked
                    'com.widevine.alpha': 'https://widevine-proxy.astro.com.my/proxy'
                },
                advanced: {
                    'com.widevine.alpha': {
                        'videoRobustness': 'SW_SECURE_DECODE',
                        'audioRobustness': 'SW_SECURE_DECODE'
                    }
                }
            }
        });

        // 3. Handle License Request Headers (Astro often requires these)
        player.getNetworkingEngine().registerRequestFilter((type, request) => {
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                // If you have a token, add it here. Example:
                // request.headers['Authorization'] = 'Bearer YOUR_TOKEN';
                console.log('Requesting License...');
            }
        });

        const manifestUri = '/api/ceria-proxy';

        try {
            await player.load(manifestUri);
            console.log('Manifest loaded successfully!');
        } catch (e) {
            console.error('Error Code:', e.code, 'Details:', e);
        }
    }

    document.addEventListener('shaka-ui-loaded', initApp);
    document.addEventListener('DOMContentLoaded', initApp);
</script>
</body>
</html>
