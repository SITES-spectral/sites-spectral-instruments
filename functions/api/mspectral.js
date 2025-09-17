// Multispectral sensors API endpoint - TEMPORARILY DISABLED
// This endpoint is disabled during database migration

export async function onRequestGet({ request, env, params }) {
  return new Response(JSON.stringify({
    error: 'Multispectral sensors temporarily unavailable',
    message: 'Multispectral sensor functionality is disabled during database migration',
    details: 'Only phenocam instruments are currently supported. Multispectral sensors will be available after the database migration is complete.',
    alternative_endpoints: {
      phenocams: '/api/phenocams',
      instruments: '/api/instruments (phenocams only)',
      platforms: '/api/platforms'
    },
    expected_availability: 'After database migration completion'
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '3600' // Suggest retry after 1 hour
    }
  });
}

export async function onRequestPost({ request, env, params }) {
  return onRequestGet({ request, env, params });
}

export async function onRequestPut({ request, env, params }) {
  return onRequestGet({ request, env, params });
}

export async function onRequestPatch({ request, env, params }) {
  return onRequestGet({ request, env, params });
}

export async function onRequestDelete({ request, env, params }) {
  return onRequestGet({ request, env, params });
}