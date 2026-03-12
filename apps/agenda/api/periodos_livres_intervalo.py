from django.http import JsonResponse
from datetime import datetime, timedelta
from apps.agenda.models import Reserva

PERIODOS = ["INTEGRAL", "MANHA", "TARDE", "NOITE"]


def periodos_livres_intervalo(request):

    data_inicio = request.GET.get("data_inicio")
    data_fim = request.GET.get("data_fim")
    ambiente_id = request.GET.get("ambiente")

    if not data_inicio or not data_fim or not ambiente_id:
        return JsonResponse(
            {"error": "data_inicio, data_fim e ambiente são obrigatórios"},
            status=400
        )

    try:
        ini = datetime.strptime(data_inicio, "%Y-%m-%d").date()
        fim = datetime.strptime(data_fim, "%Y-%m-%d").date()
    except ValueError:
        return JsonResponse({"error": "Formato de data inválido"}, status=400)

    if fim < ini:
        return JsonResponse({"error": "data_fim não pode ser menor que data_inicio"}, status=400)

    # busca todas reservas no intervalo
    reservas = Reserva.objects.filter(
        ambiente_id=ambiente_id,
        data_inicio__lte=fim,
        data_fim__gte=ini,
        status="APPROVED"
    )

    disponiveis = set(PERIODOS)

    dia = ini

    while dia <= fim:

        ocupados = set(
            reservas.filter(
                data_inicio__lte=dia,
                data_fim__gte=dia
            ).values_list("periodo", flat=True)
        )

        if "INTEGRAL" in ocupados:
            return JsonResponse({"periodos": []})

        livres_dia = set()

        for p in PERIODOS:

            if p in ocupados:
                continue

            if p == "INTEGRAL" and ocupados:
                continue

            livres_dia.add(p)

        disponiveis = disponiveis.intersection(livres_dia)

        if not disponiveis:
            break

        dia += timedelta(days=1)

    return JsonResponse({"periodos": list(disponiveis)})