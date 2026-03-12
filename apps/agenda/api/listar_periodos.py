from django.http import JsonResponse

PERIODOS = [
    {
        "id": "INTEGRAL",
        "label": "Integral (08h às 18h)",
        "inicio": "08:00",
        "fim": "18:00"
    },
    {
        "id": "MANHA",
        "label": "Manhã (08h às 12h)",
        "inicio": "08:00",
        "fim": "12:00"
    },
    {
        "id": "TARDE",
        "label": "Tarde (13h às 17h)",
        "inicio": "13:00",
        "fim": "17:00"
    },
    {
        "id": "NOITE",
        "label": "Noite (18h às 21h)",
        "inicio": "18:00",
        "fim": "21:00"
    }
]

def listar_periodos(request):
    """
    Retorna todos os períodos disponíveis no sistema.
    Essa API serve para o frontend montar os selects
    e também para lógica de disponibilidade.
    """
    return JsonResponse(PERIODOS, safe=False)