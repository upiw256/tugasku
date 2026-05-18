'use client'

import React, { useEffect, useState } from 'react';
import { getLinkMetadataAction } from '@/actions/link-actions';

export default function LinkPreview({ url }: { url: string }) {
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeta = async () => {
            setLoading(true);
            const data = await getLinkMetadataAction(url);
            setMetadata(data);
            setLoading(false);
        };
        fetchMeta();
    }, [url]);

    if (loading) return (
        <div className="bg-foreground/5 p-3 rounded-xl text-[11px] text-foreground/60 italic border border-border-custom w-full max-w-full break-all">
        </div>
    );

    if (!metadata) return (
        <a 
            href={url} 
            target="_blank" 
            className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-primary-500/10 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-500/20 transition-all border border-primary-500/20"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13"></path></svg>
            Buka Link
        </a>
    );

    return (
        <a 
            href={url} 
            target="_blank" 
            className="group flex flex-col mt-2 w-full max-w-full bg-surface rounded-2xl border border-border-custom overflow-hidden hover:border-primary-500/50 transition-all shadow-sm active:scale-95"
        >
            {metadata.image && (
                <div className="h-24 w-full relative overflow-hidden bg-foreground/5">
                    <img src={metadata.image} alt={metadata.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
            )}
            <div className="p-3">
                <h4 className="text-[11px] font-black text-foreground truncate uppercase tracking-tight">{metadata.title || url}</h4>
                {metadata.description && (
                    <p className="text-[10px] text-foreground/40 line-clamp-2 mt-1 font-medium leading-relaxed">
                        {metadata.description}
                    </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                    <svg className="w-2.5 h-2.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
                    <span className="text-[9px] font-bold text-foreground/20 truncate lowercase">{new URL(url).hostname}</span>
                </div>
            </div>
        </a>
    );
}