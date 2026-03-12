from django.shortcuts import render


def index(request):
    return render(request, 'agenda/index.html')


def login(request):
    return render(request, 'agenda/login.html')


def restrito(request):
    return render(request, 'agenda/restrito.html')


def checklist(request):
    return render(request, 'agenda/checklist.html')


def checklist_out(request):
    return render(request, 'agenda/checklist-out.html')


def alterar_senha(request):
    return render(request, 'agenda/alterar-senha.html')


def recuperar_senha(request):
    return render(request, 'agenda/recuperar-senha.html')


def reset_senha(request):
    return render(request, 'agenda/reset-senha.html')