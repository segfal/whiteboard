/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Enable WebAssembly
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            layers: true,
        };

        // Add rules for WASM and JS files
        config.module.rules.push({
            test: /\.wasm$/,
            type: 'asset/resource',
        });

        // Handle JS files from public directory
        config.module.rules.push({
            test: /whiteboard\.js$/,
            type: 'javascript/auto',
            resolve: {
                fullySpecified: false,
            },
        });

        return config;
    },
    // Add headers for WASM and JS files
    async headers() {
        return [
            {
                source: '/wasm/:path*',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/wasm',
                    },
                ],
            },
            {
                source: '/wasm/whiteboard.js',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/javascript',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig; 