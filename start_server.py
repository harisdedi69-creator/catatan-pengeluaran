import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print(" CatatDuit Pro - Aplikasi Catatan Pengeluaran Harian")
        print("=" * 60)
        print(f" Server berjalan di : {url}")
        print(f" Direktori Proyek   : {DIRECTORY}")
        print(" Tekan CTRL + C di terminal untuk menghentikan server.")
        print("=" * 60)
        
        try:
            webbrowser.open(url)
        except Exception:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n Server dimatikan. Sampai jumpa!")

if __name__ == "__main__":
    run()
