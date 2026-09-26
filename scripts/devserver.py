# Lokale testserver die de nette URL's van de live site begrijpt (zoals Cloudflare):
#   /Diensten        -> Diensten.html
#   /AI%20Chatbots   -> AI Chatbots.html
#   /lokaal/         -> lokaal/index.html
#   onbekend adres   -> 404.html (status 404)
# Gebruik (vanuit de projectmap):  py scripts/devserver.py [poort]     standaard 8777
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p) and os.path.isfile(p + '.html'):
            return p + '.html'
        return p

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, '404.html')
        if code == 404 and os.path.isfile(page):
            body = open(page, 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def end_headers(self):
        # geen cache: wat je bewaart, zie je meteen
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    print('EM Launchpad lokaal op http://localhost:%d' % port)
    http.server.ThreadingHTTPServer(('', port), Handler).serve_forever()
