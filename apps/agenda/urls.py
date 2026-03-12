from django.urls import path
from .views import (
    index,
    login,
    checklist,
    checklist_out,
    alterar_senha,
    recuperar_senha,
    reset_senha,
    restrito,
)

urlpatterns = [

    path('', index, name="agenda_index"),
    path('login/', login, name="agenda_login"),
    path('restrito/', restrito, name="agenda_restrito"),

    path('checklist/', checklist, name="agenda_checklist"),
    path('checklist-out/', checklist_out, name="agenda_checklist_out"),

    path('alterar-senha/', alterar_senha, name="agenda_alterar_senha"),
    path('recuperar-senha/', recuperar_senha, name="agenda_recuperar_senha"),
    path('reset-senha/', reset_senha, name="agenda_reset_senha"),
]