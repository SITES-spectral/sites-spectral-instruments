// SITES Spectral Stations & Instruments - Main Worker v15.8.2
// Hexagonal Architecture with Cloudflare Workers + Subdomain Routing
// Handles both static assets and API routes with Cloudflare Access authentication
//
// Architecture Credit: This subdomain-based architecture design is based on
// architectural knowledge shared by Flights for Biodiversity Sweden AB
// (https://github.com/flightsforbiodiversity)
//
// v15.6.11: Added persistent session cookie for CF Access users (SEC-007)
// When CF Access authentication succeeds, an internal session cookie is issued
// to provide persistent authentication without requiring OTP re-verification

import { createCors, validateCorsOrigin, createCorsErrorResponse } from './cors';
import { handleApiRequest } from './api-handler';
import { CloudflareAccessAdapter } from './infrastructure/auth/CloudflareAccessAdapter.js';
import { generateToken } from './auth/authentication.js';
import { createAuthCookie, getTokenFromCookie } from './auth/cookie-utils.js';

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

  // Workers.dev URLs: subdomain override DISABLED in production (SEC-008)
  // CF Access does NOT protect workers.dev URLs, so allowing subdomain
  // spoofing here would bypass all portal authentication.
  // Only allow in local development (localhost/127.0.0.1).

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
    // Redirect unauthorized station portal users to the public portal
    return Response.redirect('https://sitesspectral.work', 302);
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
  // Redirect unauthorized station portal users to the public portal
  if (portalType === 'station') {
    return Response.redirect('https://sitesspectral.work', 302);
  }

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

      // Try to get user from CF Access JWT
      const cfAdapter = new CloudflareAccessAdapter(env);
      let user = await cfAdapter.verifyAccessToken(request);

      // For static assets (HTML, CSS, JS), serve portal-appropriate pages
      // Auth is enforced at two levels:
      //   1. CF Access gateway blocks unauthenticated users at the edge
      //   2. Frontend JS calls /api/auth/verify for user details and redirects if needed
      if (!url.pathname.startsWith('/api/')) {

        // Admin portal: require verified user with admin role
        if (portalType === 'admin') {
          if (!user) {
            return createPortalUnauthorizedResponse(portalType, subdomain);
          }
          const canAccess = CloudflareAccessAdapter.canAccessPortal(user, portalType, subdomain);
          if (!canAccess) {
            return createPortalForbiddenResponse(portalType, subdomain, user);
          }
        }

        // Station portals: always serve station-dashboard.html
        // CF Access protects the subdomain at the edge (gateway level).
        // The CF_Authorization cookie is validated by CF Access before the
        // request reaches this worker, but the Cf-Access-Jwt-Assertion header
        // may not always be present (e.g., after cookie-based re-auth).
        // The frontend calls /api/auth/verify to get user details and
        // redirects unauthorized users to the public portal.

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

      // v15.6.11 (SEC-007): Issue persistent session cookie for CF Access users
      // This prevents requiring OTP re-authentication when CF Access JWT expires
      // The internal session cookie lasts 24 hours and is shared across subdomains
      if (user && user.auth_provider === 'cloudflare_access') {
        const existingCookie = getTokenFromCookie(request);
        if (!existingCookie) {
          try {
            // Generate internal JWT for persistent session
            const internalToken = await generateToken(user, env);
            const authCookie = createAuthCookie(internalToken, request);
            response.headers.set('Set-Cookie', authCookie);
          } catch (cookieError) {
            // Don't fail the request if cookie generation fails
            console.warn('Failed to create session cookie for CF Access user:', cookieError);
          }
        }
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
      '/': '/station-dashboard.html',
      default: '/station-dashboard.html'
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
