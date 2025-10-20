from django.urls import path
from .consumers import VideoRoomConsumer

websocket_urlpatterns=[
    path('ws/video_chat', VideoRoomConsumer.as_asgi()),
]
