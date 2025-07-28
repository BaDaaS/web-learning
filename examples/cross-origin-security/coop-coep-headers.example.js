/**
 * Cross-Origin Embedder Policy (COEP) and Cross-Origin Opener Policy (COOP)
 * Configuration for SharedArrayBuffer Support
 *
 * This example shows how to configure HTTP headers to enable SharedArrayBuffer
 * and related APIs that require cross-origin isolation.
 */

// Express.js middleware for setting COOP/COEP headers
function setCrossOriginIsolationHeaders(req, res, next) {
  // Cross-Origin Embedder Policy - requires all resources to be same-origin
  // or cross-origin resources to opt-in via CORP headers
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin Opener Policy - isolates browsing context from other origins
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // Additional security headers
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
}

// Alternative configuration for development/testing
function setDevelopmentHeaders(req, res, next) {
  // More permissive settings for development
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
}

// Client-side feature detection
function checkCrossOriginIsolation() {
  const features = {
    crossOriginIsolated:
      typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    atomics: typeof Atomics !== 'undefined',
    wasmThreads: false,
    highResolutionTime: false,
  };

  // Check for WASM threads support
  try {
    // This is a simplified check - real implementation would be more thorough
    features.wasmThreads =
      typeof SharedArrayBuffer !== 'undefined' && typeof Worker !== 'undefined';
  } catch (e) {
    features.wasmThreads = false;
  }

  // Check for high-resolution timer access
  try {
    const start = performance.now();
    setTimeout(() => {
      const end = performance.now();
      // High-resolution timers should provide sub-millisecond precision
      features.highResolutionTime = (end - start) % 1 !== 0;
    }, 0);
  } catch (e) {
    features.highResolutionTime = false;
  }

  return features;
}

// Webpack Dev Server configuration for cross-origin isolation
const webpackDevServerConfig = {
  // Enable HTTPS (required for cross-origin isolation in many browsers)
  https: true,

  // Set headers for all responses
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  },

  // Allow serving files with proper CORP headers
  static: {
    serveIndex: false,
    headers: {
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  },

  // Configure proxy for API calls that need CORP headers
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['Cross-Origin-Resource-Policy'] = 'same-origin';
      },
    },
  },
};

// Nginx configuration example (as comment for reference)
/*
server {
    listen 443 ssl http2;
    server_name your-app.example.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Cross-origin isolation headers
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Resource-Policy "same-origin" always;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;

        # Ensure all static assets have proper CORP header
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|json)$ {
            add_header Cross-Origin-Resource-Policy "same-origin" always;
            expires 1y;
        }
    }

    # API endpoints that might be called from web workers
    location /api/ {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Ensure API responses have proper CORP header
        add_header Cross-Origin-Resource-Policy "same-origin" always;
    }
}
*/

// Runtime check and fallback handling
function initializeWithCrossOriginSupport() {
  const isolation = checkCrossOriginIsolation();

  console.log('Cross-origin isolation status:', isolation);

  if (!isolation.crossOriginIsolated) {
    console.warn(
      'Cross-origin isolation not enabled. SharedArrayBuffer and related APIs may not be available.'
    );
    console.warn(
      'Ensure your server is sending the following headers:\n' +
        '  Cross-Origin-Embedder-Policy: require-corp\n' +
        '  Cross-Origin-Opener-Policy: same-origin'
    );

    // Provide fallback implementation or show user message
    return false;
  }

  if (!isolation.sharedArrayBuffer) {
    console.warn(
      'SharedArrayBuffer not available despite cross-origin isolation'
    );
    return false;
  }

  // All checks passed - can use SharedArrayBuffer and related APIs
  console.log('Cross-origin isolation successfully enabled');
  return true;
}

// Example of checking headers in development
function debugHeaders() {
  if (typeof document !== 'undefined') {
    fetch(window.location.href, { method: 'HEAD' })
      .then((response) => {
        console.log('Response headers:');
        for (const [key, value] of response.headers.entries()) {
          if (key.toLowerCase().includes('cross-origin')) {
            console.log(`  ${key}: ${value}`);
          }
        }
      })
      .catch((error) => {
        console.error('Failed to check headers:', error);
      });
  }
}

export {
  setCrossOriginIsolationHeaders,
  setDevelopmentHeaders,
  checkCrossOriginIsolation,
  initializeWithCrossOriginSupport,
  debugHeaders,
  webpackDevServerConfig,
};
