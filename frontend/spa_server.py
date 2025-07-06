#!/usr/bin/env python3
"""
Simple SPA (Single Page Application) server for React Router
Serves index.html for all routes that don't match static files
"""

import http.server
import socketserver
import os
import mimetypes
import urllib.request
import urllib.error
from urllib.parse import urlparse

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Check if this is an API request
        if path.startswith('/api/'):
            return self.proxy_api_request()

        # Remove leading slash
        if path.startswith('/'):
            path = path[1:]

        # If path is empty, serve index.html
        if not path:
            path = 'index.html'

        # Check if the requested file exists
        if os.path.exists(path) and os.path.isfile(path):
            # File exists, serve it normally
            return super().do_GET()
        else:
            # File doesn't exist, check if it's a static asset
            if (path.startswith('assets/') or
                path.endswith('.js') or
                path.endswith('.css') or
                path.endswith('.png') or
                path.endswith('.svg') or
                path.endswith('.ico')):
                # It's a static asset that doesn't exist, return 404
                self.send_error(404, "File not found")
                return

            # It's likely a React Router route, serve index.html
            self.path = '/index.html'
            # Add cache-busting headers for HTML
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()

            # Read and serve index.html
            with open('index.html', 'rb') as f:
                self.wfile.write(f.read())
            return

    def do_POST(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Check if this is an API request
        if path.startswith('/api/'):
            return self.proxy_api_request()

        # For non-API POST requests, return 404
        self.send_error(404, "Not found")

    def proxy_api_request(self):
        """Proxy API requests to the backend server"""
        try:
            # Backend server URL - use environment variable for Railway deployment
            backend_base = os.getenv("BACKEND_URL", "http://localhost:8000")
            backend_url = f"{backend_base}{self.path}"

            # Create request
            if self.command == 'GET':
                req = urllib.request.Request(backend_url)
            elif self.command == 'POST':
                # Read POST data
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                req = urllib.request.Request(backend_url, data=post_data)
                req.add_header('Content-Type', self.headers.get('Content-Type', 'application/json'))

            # Copy headers
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'content-length']:
                    req.add_header(header, value)

            # Make request to backend
            with urllib.request.urlopen(req) as response:
                # Send response status
                self.send_response(response.getcode())

                # Copy response headers
                for header, value in response.headers.items():
                    if header.lower() not in ['server', 'date']:
                        self.send_header(header, value)

                # Add cache-busting headers for API responses
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()

                # Copy response body
                self.wfile.write(response.read())

        except urllib.error.HTTPError as e:
            # Forward HTTP errors
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            # Handle other errors
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == "__main__":
    # Use Railway's dynamic PORT or fallback to 5173 for development
    PORT = int(os.getenv("PORT", 5173))
    
    # Change to the dist directory
    os.chdir('dist')
    
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"🚀 SPA Server running at http://localhost:{PORT}")
        print("📱 This server handles React Router routes correctly")
        print("🛑 Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")
            httpd.shutdown()
