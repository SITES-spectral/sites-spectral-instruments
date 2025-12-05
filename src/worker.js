// SITES Spectral Stations & Instruments - Main Worker v10.0.0
// Hexagonal Architecture with Cloudflare Workers
// Handles both static assets and API routes

import { createCors } from './cors';
import { handleApiRequest } from './api-handler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { corsHeaders, handleCors } = createCors();

    // HTTPS Enforcement - Redirect HTTP to HTTPS
    // Note: Cloudflare typically handles this at edge, but we ensure it here
    if (url.protocol === 'http:' && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      return Response.redirect(httpsUrl.toString(), 301);
    }

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCors();
    }

    try {
      // API Routes
      if (url.pathname.startsWith('/api/')) {
        const response = await handleApiRequest(request, env, ctx);
        
        // Add CORS headers to API responses
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        return response;
      }

      // Static Asset Serving
      return await handleStaticAssets(request, env, corsHeaders);
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

async function handleStaticAssets(request, env, corsHeaders) {
  const url = new URL(request.url);
  
  // Default to index.html for SPA routing
  const assetPaths = [
    '/stations.html',
    '/instruments.html',
    '/export.html',
    '/station-dashboard.html',
    '/sites-dashboard.html',
    '/instrument.html'
  ];
  
  let assetPath = url.pathname;
  
  // Handle SPA routing - serve index.html for app routes
  if (assetPaths.some(path => url.pathname.startsWith(path.replace('.html', '')))) {
    assetPath = url.pathname + '.html';
  } else if (url.pathname === '/') {
    assetPath = '/index.html';
  }
  
  // Try to get the asset from the static assets binding
  try {
    const asset = await env.ASSETS.fetch(new URL(assetPath, request.url).toString());
    
    if (asset.status === 404) {
      // For unmatched routes, serve index.html (SPA fallback)
      const indexAsset = await env.ASSETS.fetch(new URL('/index.html', request.url).toString());
      if (indexAsset.ok) {
        const response = new Response(indexAsset.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders
          }
        });
        return response;
      }
    }
    
    if (asset.ok) {
      const response = new Response(asset.body, {
        status: asset.status,
        headers: {
          ...asset.headers,
          ...corsHeaders
        }
      });
      return response;
    }
    
  } catch (error) {
    console.error('Static asset error:', error);
  }
  
  // 404 fallback
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders
  });
}