// CORS handling for the SITES Spectral application

export function createCors() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  const handleCors = () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  };

  return { corsHeaders, handleCors };
}