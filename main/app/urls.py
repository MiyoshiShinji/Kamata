from django.urls import path
from . import views

urlpatterns = [
    #page
    path('', views.home, name='home'),
    path('test/', views.test, name='test'),

    #api/sortable.js
    path('api/update-task-position/', views.update_task_position, name='update_task_position'),
    path('api/update-list-title/', views.update_list_title, name='update_list_title'),
    path('api/create-list/', views.create_list, name='create_list'),
    path('api/delete-list/', views.delete_list, name='delete_list'),
    path('api/create-task/', views.create_task, name='create_task'),
]
