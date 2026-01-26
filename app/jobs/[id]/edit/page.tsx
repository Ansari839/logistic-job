'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function EditJobRedirect({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();

    useEffect(() => {
        router.replace(`/jobs/${id}`);
    }, [id, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full shadow-xl shadow-blue-600/20" />
        </div>
    );
}
