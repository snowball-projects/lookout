"""Local static preview; never accepts uploads."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'web'
print('Local: http://127.0.0.1:8772/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8772),partial(SimpleHTTPRequestHandler,directory=str(root))).serve_forever()
