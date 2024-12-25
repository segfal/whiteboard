'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Whiteboard component with no SSR
const Whiteboard = dynamic(() => import('../components/Whiteboard'), {
    ssr: false,
});

export default function Home() {
    return (
        <main className="min-h-screen">
            <Whiteboard />
        </main>
    );
}
