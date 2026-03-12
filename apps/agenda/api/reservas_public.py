from django.http import JsonResponse
from datetime import timedelta
from apps.agenda.models import Reserva


def reservas_public(request):

    ambiente = request.GET.get("ambiente")
    start = request.GET.get("start")
    end = request.GET.get("end")

    if not ambiente:
        return JsonResponse({"error": "parâmetro ambiente é obrigatório"}, status=400)

    try:
        ambiente_id = int(ambiente)
    except ValueError:
        return JsonResponse({"error": "ambiente inválido"}, status=400)

    filtros = {}
        
    if ambiente_id:
        filtros["ambiente_id"] = ambiente_id

    if start:
        filtros["data_fim__gte"] = start

    if end:
        filtros["data_inicio__lte"] = end

    reservas = Reserva.objects.filter(**filtros
                                      ).exclude(status__in=["NEGADA", "CANCELADA"]
                                                ).select_related("ambiente")

    eventos = []

    for r in reservas:

        inicio = r.data_inicio
        fim = r.data_fim or r.data_inicio

        end_exclusive = fim + timedelta(days=1)

        status_upper = (r.status or "").upper()

        if status_upper == "APROVADA":
            cor = "#c71c22"
            texto_cor = "#ffffff"
            status_label = "Confirmado"
        else:
            cor = "#f6c344"
            texto_cor = "#111010"
            status_label = "Solicitado"

        ambiente_label = r.ambiente.nome
        periodo_label = r.periodo or ""

        titulo = f"{ambiente_label} – {status_label} – {r.instituicao}"

        if periodo_label:
            titulo += f" ({periodo_label})"

        tooltip = (
            f"Status: {status_label}\n"
            f"Instituição: {r.instituicao}\n"
            f"Responsável: {r.responsavel}\n"
            f"Ambiente: {ambiente_label}\n"
            f"Período: {periodo_label}\n"
            f"Data inicial: {inicio}\n"
            f"Data final: {fim}"
        )

        eventos.append({
            "title": titulo,
            "start": inicio,
            "end": end_exclusive,
            "allDay": True,
            "display": "block",
            "color": cor,
            "textColor": texto_cor,
            "extendedProps": {
                "tooltip": tooltip
            }
        })

    return JsonResponse(eventos, safe=False)