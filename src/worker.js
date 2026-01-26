// SITES Spectral Stations & Instruments - Main Worker v15.0.2
// Hexagonal Architecture with Cloudflare Workers + Subdomain Routing
// Handles both static assets and API routes with Cloudflare Access authentication
//
// Architecture Credit: This subdomain-based architecture design is based on
// architectural knowledge shared by Flights for Biodiversity Sweden AB
// (https://github.com/flightsforbiodiversity)

import { createCors, validateCorsOrigin, createCorsErrorResponse } from './cors';
import { handleApiRequest } from './api-handler';
import { CloudflareAccessAdapter } from './infrastructure/auth/CloudflareAccessAdapter.js';

/**
 * Get subdomain from Host header
 *
 * @param {Request} request - Incoming request
 * @returns {string|null} Subdomain or null for root domain
 */
function getSubdomain(request) {
  const host = request.headers.get('Host') || '';
  const parts = host.split('.');

  // Expected formats:
  // - sitesspectral.work (root domain)
  // - admin.sitesspectral.work (admin subdomain)
  // - svartberget.sitesspectral.work (station subdomain)
  if (parts.length === 3 && parts[1] === 'sitesspectral' && parts[2] === 'work') {
    return parts[0];
  }

  // For Workers dev URL, use X-Subdomain header (testing) or query param
  if (host.includes('workers.dev')) {
    const subdomainHeader = request.headers.get('X-Subdomain');
    if (subdomainHeader) {
      return subdomainHeader;
    }

    // Check query param for testing
    const url = new URL(request.url);
    const subdomainParam = url.searchParams.get('subdomain');
    if (subdomainParam) {
      return subdomainParam;
    }
  }

  return null;
}

/**
 * Determine portal type from subdomain
 *
 * @param {string|null} subdomain - Subdomain from request
 * @returns {'public'|'admin'|'station'} Portal type
 */
function getPortalType(subdomain) {
  if (!subdomain || subdomain === 'www') {
    return 'public';
  }

  if (subdomain === 'admin') {
    return 'admin';
  }

  // Any other subdomain is treated as a station portal
  return 'station';
}

/**
 * Create unauthorized response for portal access
 *
 * @param {string} portalType - Portal type
 * @param {string|null} subdomain - Subdomain
 * @returns {Response}
 */
function createPortalUnauthorizedResponse(portalType, subdomain) {
  if (portalType === 'admin') {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Admin portal requires Cloudflare Access authentication',
      portal: 'admin',
      hint: 'Please authenticate via Cloudflare Access'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (portalType === 'station') {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: `Station portal (${subdomain}) requires authentication`,
      portal: 'station',
      station: subdomain,
      hint: 'Please authenticate via Cloudflare Access or magic link'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Unauthorized', { status: 401 });
}

/**
 * Create forbidden response for portal access
 *
 * @param {string} portalType - Portal type
 * @param {string|null} subdomain - Subdomain
 * @param {Object} user - Authenticated user
 * @returns {Response}
 */
function createPortalForbiddenResponse(portalType, subdomain, user) {
  return new Response(JSON.stringify({
    error: 'Forbidden',
    message: `You do not have access to this ${portalType} portal`,
    portal: portalType,
    station: subdomain,
    user_role: user?.role,
    user_station: user?.station_acronym
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const subdomain = getSubdomain(request);
    const portalType = getPortalType(subdomain);

    // Pass request to createCors for proper origin validation
    const { corsHeaders, handleCors } = createCors(request);

    // HTTPS Enforcement - Redirect HTTP to HTTPS
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
      // === PUBLIC PORTAL ===
      // No authentication required for public portal
      if (portalType === 'public') {
        // API Routes for public portal
        if (url.pathname.startsWith('/api/')) {
          // Public API endpoints don't require auth
          // But standard API endpoints will check auth as usual
          const response = await handleApiRequest(request, env, ctx);

          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          return response;
        }

        // Static Asset Serving for public portal
        return await handleStaticAssets(request, env, corsHeaders, portalType);
      }

      // === ADMIN and STATION PORTALS ===
      // Require Cloudflare Access authentication

      // Try to get user from CF Access JWT
      const cfAdapter = new CloudflareAccessAdapter(env);
      let user = await cfAdapter.verifyAccessToken(request);

      // If no CF Access token, API endpoints may still use legacy auth
      // This is handled in handleApiRequest via getUserFromRequest

      // For static assets on protected portals, require CF Access
      if (!url.pathname.startsWith('/api/')) {
        if (!user) {
          // No CF Access token - redirect to CF Access login
          // Cloudflare Access handles this automatically via the WAF rules
          // If we reach here, it means CF Access is not configured or bypassed
          return createPortalUnauthorizedResponse(portalType, subdomain);
        }

        // Check if user can access this portal
        const canAccess = CloudflareAccessAdapter.canAccessPortal(user, portalType, subdomain);
        if (!canAccess) {
          return createPortalForbiddenResponse(portalType, subdomain, user);
        }

        // Serve static assets for authenticated portal
        return await handleStaticAssets(request, env, corsHeaders, portalType, subdomain, user);
      }

      // === API ROUTES ===
      // Add subdomain and portal context to request for downstream handlers
      request.subdomain = subdomain;
      request.portalType = portalType;
      request.cfAccessUser = user;

      const response = await handleApiRequest(request, env, ctx);

      // Add CORS headers to API responses
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add portal context headers
      response.headers.set('X-Portal-Type', portalType);
      if (subdomain) {
        response.headers.set('X-Subdomain', subdomain);
      }

      return response;

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

/**
 * Handle static asset serving
 *
 * @param {Request} request - Incoming request
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} corsHeaders - CORS headers
 * @param {string} portalType - Portal type
 * @param {string|null} subdomain - Subdomain
 * @param {Object|null} user - Authenticated user
 * @returns {Promise<Response>}
 */
async function handleStaticAssets(request, env, corsHeaders, portalType = 'public', subdomain = null, user = null) {
  const url = new URL(request.url);

  // Portal-specific asset paths
  const portalAssetMappings = {
    public: {
      '/': '/public-dashboard.html',
      default: '/public-dashboard.html'
    },
    admin: {
      '/': '/sites-dashboard.html',
      default: '/sites-dashboard.html'
    },
    station: {
      '/': '/station-portal.html',
      default: '/station-portal.html'
    }
  };

  // Known HTML pages
  const assetPaths = [
    '/stations.html',
    '/instruments.html',
    '/export.html',
    '/station-dashboard.html',
    '/station-portal.html',
    '/sites-dashboard.html',
    '/public-dashboard.html',
    '/instrument.html',
    '/login.html',
    '/admin.html'
  ];

  let assetPath = url.pathname;

  // Handle SPA routing - determine default page based on portal type
  if (assetPaths.some(path => url.pathname.startsWith(path.replace('.html', '')))) {
    assetPath = url.pathname + '.html';
  } else if (url.pathname === '/') {
    // Use portal-specific default page
    const portalMapping = portalAssetMappings[portalType] || portalAssetMappings.public;
    assetPath = portalMapping['/'] || '/index.html';
  }

  // Try to get the asset from the static assets binding
  try {
    const asset = await env.ASSETS.fetch(new URL(assetPath, request.url).toString());

    if (asset.status === 404) {
      // For unmatched routes, serve portal-specific fallback
      const portalMapping = portalAssetMappings[portalType] || portalAssetMappings.public;
      const fallbackPath = portalMapping.default || '/index.html';
      const fallbackAsset = await env.ASSETS.fetch(new URL(fallbackPath, request.url).toString());

      if (fallbackAsset.ok) {
        const response = new Response(fallbackAsset.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-Portal-Type': portalType,
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
          'X-Portal-Type': portalType,
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
