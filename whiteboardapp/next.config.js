/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Add WASM support
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
            test: /\.js$/,
            type: 'javascript/auto',
            resolve: {
                fullySpecified: false,
            },
        });

        return config;
    },
    // Serve WASM files with correct MIME type
    async headers() {
        return [
            {
                source: '/:path*.wasm',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/wasm',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig; 