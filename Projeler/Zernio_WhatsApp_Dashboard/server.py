#!/usr/bin/env python3
import os
import sys
import json
import urllib.parse
import urllib.request
import urllib.error
import http.server
import socketserver

PORT = 8000

# Force stdout/stderr to UTF-8 on Windows
if sys.platform.startswith("win"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def load_zernio_key():
    # Attempt to load from env first
    api_key = os.getenv("ZERNIO_API_KEY")
    if api_key:
        return api_key.strip()
        
    # Fallback to local .env
    dot_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(dot_env):
        with open(dot_env, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("ZERNIO_API_KEY="):
                    return line.strip().split("=")[1].strip()
                    
    # Fallback to master.env
    master_env = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "_knowledge", "credentials", "master.env"))
    if os.path.exists(master_env):
        with open(master_env, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("ZERNIO_API_KEY="):
                    return line.strip().split("=")[1].strip()

    raise ValueError("[ERROR] ZERNIO_API_KEY not found in environment, local .env, or master.env")

def make_zernio_api_call(method, path, payload=None):
    try:
        api_key = load_zernio_key()
    except Exception as e:
        return 500, {"error": str(e)}

    url = f"https://api.zernio.com/v1{path}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Zernio-Dashboard-Server/1.0"
    }
    
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            body = response.read().decode("utf-8")
            try:
                return status, json.loads(body)
            except Exception:
                return status, {"response": body}
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode("utf-8")
        try:
            return status, json.loads(body)
        except Exception:
            return status, {"error": body}
    except Exception as e:
        return 500, {"error": str(e)}

class DashboardRequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve static assets from 'static' directory
        if not path.startswith("/api/"):
            if path == "/" or path == "":
                path = "/index.html"
            static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
            clean_path = path.lstrip('/')
            return os.path.join(static_dir, clean_path)
        return super().translate_path(path)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        if path.startswith("/api/"):
            self.handle_api_get(path, query_params)
        else:
            super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith("/api/"):
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                body = json.loads(post_data) if post_data else {}
            except Exception:
                self.send_api_response(400, {"error": "Invalid JSON body"})
                return

            self.handle_api_post(path, body)
        else:
            self.send_error(404, "Endpoint not found")

    def send_api_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def handle_api_get(self, path, query_params):
        if path == "/api/sandbox-status":
            # 1. Fetch sessions
            status_sessions, data_sessions = make_zernio_api_call("GET", "/whatsapp/sandbox/sessions")
            # 2. Fetch numbers to get Sandbox Account Details
            status_numbers, data_numbers = make_zernio_api_call("GET", "/whatsapp/phone-numbers")
            
            combined = {
                "sessions": data_sessions.get("sessions", []) if status_sessions == 200 else [],
                "sandbox": data_numbers.get("sandbox", {}) if status_numbers == 200 else {}
            }
            self.send_api_response(200, combined)
            
        elif path == "/api/conversations":
            status, data = make_zernio_api_call("GET", "/inbox/conversations?platform=whatsapp")
            self.send_api_response(status, data)
            
        elif path == "/api/messages":
            conv_id = query_params.get("conversationId", [None])[0]
            acc_id = query_params.get("accountId", [None])[0]
            
            if not conv_id or not acc_id:
                self.send_api_response(400, {"error": "conversationId and accountId are required"})
                return
                
            status, data = make_zernio_api_call(
                "GET", 
                f"/inbox/conversations/{conv_id}/messages?accountId={acc_id}&limit=50&sortOrder=asc"
            )
            self.send_api_response(status, data)
            
        else:
            self.send_api_response(404, {"error": "API route not found"})

    def handle_api_post(self, path, body):
        if path == "/api/conversations":
            # Initiate conversation with template
            phone = body.get("phone")
            if not phone:
                self.send_api_response(400, {"error": "phone number is required"})
                return
                
            phone = phone.strip().replace("+", "")
            
            # Fetch sandbox details to get accountId & template
            status_numbers, data_numbers = make_zernio_api_call("GET", "/whatsapp/phone-numbers")
            if status_numbers != 200 or not data_numbers.get("sandbox"):
                self.send_api_response(500, {"error": "Failed to discover Zernio sandbox configuration"})
                return
                
            sandbox = data_numbers["sandbox"]
            account_id = sandbox["accountId"]
            template_name = sandbox.get("template", {}).get("name", "sandbox_start")
            template_lang = sandbox.get("template", {}).get("language", "en")
            
            payload = {
                "accountId": account_id,
                "participantUsername": phone,
                "templateName": template_name,
                "templateLanguage": template_lang
            }
            
            status, data = make_zernio_api_call("POST", "/inbox/conversations", payload)
            self.send_api_response(status, data)

        elif path == "/api/messages":
            # Send freeform message
            conv_id = body.get("conversationId")
            acc_id = body.get("accountId")
            message = body.get("message")
            
            if not conv_id or not acc_id or not message:
                self.send_api_response(400, {"error": "conversationId, accountId, and message are required"})
                return
                
            payload = {
                "accountId": acc_id,
                "message": message
            }
            
            status, data = make_zernio_api_call("POST", f"/inbox/conversations/{conv_id}/messages", payload)
            self.send_api_response(status, data)
            
        else:
            self.send_api_response(404, {"error": "API route not found"})

def run_server():
    # Make sure static directory exists
    static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    os.makedirs(static_path, exist_ok=True)

    handler = DashboardRequestHandler
    
    # Allow socket address reuse to prevent "address already in use" errors on quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"[SUCCESS] Zernio Dashboard Sunucusu başlatıldı!")
        print(f"👉 http://localhost:{PORT} adresinden erişebilirsiniz.")
        print("Kapatmak için Ctrl+C tuşlarına basın.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] Sunucu durduruldu.")
            sys.exit(0)

if __name__ == "__main__":
    run_server()
