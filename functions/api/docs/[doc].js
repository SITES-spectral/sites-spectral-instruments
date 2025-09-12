// Documentation file server for SITES Spectral
// Serves markdown files from the docs folder

import fs from 'fs/promises';
import path from 'path';

export async function onRequestGet({ params, env }) {
    try {
        const docName = params.doc;
        
        // Security: Only allow specific documentation files
        const allowedDocs = [
            'STATION_MANAGEMENT_GUIDE.md',
            'AUTHENTICATION_SETUP.md', 
            'PLATFORM_STATUS_REAL_DATA.md',
            'SYSTEM_STATUS_SUMMARY.md'
        ];
        
        if (!allowedDocs.includes(docName)) {
            return new Response('Documentation not found', { status: 404 });
        }
        
        // Try to read the documentation file
        const docPath = path.join(process.cwd(), 'docs', docName);
        
        try {
            const content = await fs.readFile(docPath, 'utf-8');
            
            return new Response(content, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
                }
            });
        } catch (fileError) {
            console.error('Failed to read documentation file:', fileError);
            return new Response('Documentation file not found', { status: 404 });
        }
        
    } catch (error) {
        console.error('Documentation server error:', error);
        return new Response('Internal server error', { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}