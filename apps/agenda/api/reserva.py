from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from apps.agenda.models import Reserva
import json


@csrf_exempt
def criar_reserva(request):

    if request.method != "POST":
        return JsonResponse({"error": "Método não permitido"}, status=405)

    try:

        instituicao = request.POST.get("instituicao")
        responsavel = request.POST.get("responsavel")
        ambiente_id = request.POST.get("ambiente")
        periodo = request.POST.get("periodo")

        data_inicio = request.POST.get("data_inicio")
        data_fim = request.POST.get("data_fim")

        tipo = request.POST.get("tipo_solicitacao")
        finalidade = request.POST.get("finalidade")

        reserva = Reserva.objects.create(
            instituicao=instituicao,
            responsavel=responsavel,
            ambiente_id=ambiente_id,
            periodo=periodo,
            data_inicio=data_inicio,
            data_fim=data_fim,
            tipo_solicitacao=tipo,
            finalidade=finalidade,
            status="PENDENTE"
        )

        return JsonResponse({
            "message": "Reserva criada com sucesso",
            "id": reserva.id
        }, status=201)

    except IntegrityError:

        return JsonResponse({
            "error": "Este horário acabou de ser reservado por outro usuário. Atualize a agenda."
        }, status=409)

    except Exception as e:

        return JsonResponse({
            "error": "Erro ao salvar reserva",
            "detail": str(e)
        }, status=500)