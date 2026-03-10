from django.db import models

# Create your models here.
class Ambiente(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Reserva(models.Model):

    class TipoSolicitacao(models.TextChoices):
        INTERNA = "INTERNA", "Interna"
        EXTERNA = "EXTERNA", "Externa"

    class StatusReserva(models.TextChoices):
        PENDING = "PENDING", "Pendente"
        APPROVED = "APPROVED", "Aprovada"
        REJECTED = "REJECTED", "Rejeitada"

    ambiente = models.ForeignKey(
        Ambiente,
        on_delete=models.CASCADE,
        related_name="reservas"
    )

    tipo_solicitacao = models.CharField(
        max_length=10,
        choices=TipoSolicitacao.choices
    )

    instituicao = models.CharField(max_length=200)
    responsavel = models.CharField(max_length=200)
    email = models.EmailField()
    telefone = models.CharField(max_length=20)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    periodo = models.CharField(max_length=50)
    finalidade = models.CharField(max_length=200)
    observacoes = models.TextField(blank=True)
    anexo_edocs = models.FileField(
        upload_to="anexos/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=10,
        choices=StatusReserva.choices,
        default=StatusReserva.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ambiente} - {self.data_inicio} ({self.status})"