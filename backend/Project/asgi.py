# Project/asgi.py
import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from videocall_server import routings as video_routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Project.settings")

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(video_routing.websocket_urlpatterns),
})
 