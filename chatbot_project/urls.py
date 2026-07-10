"""
URL configuration for chatbot_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from chatbot import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.chat_page, name='chat_page'),
    path('api/chat/', views.chat_api, name='chat_api'),
    path('api/chat/export/', views.chat_export, name='chat_export'),
    path('api/filter_count/', views.filter_count_api, name='filter_count_api'),
]
