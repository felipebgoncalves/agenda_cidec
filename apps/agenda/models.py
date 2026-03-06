from django.db import models

# Create your models here.
class Room(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Reservation(models.Model):

    class TipoSolicitacao(models.TextChoices):
        INTERNA = "INTERNA", "Interna"
        EXTERNA = "EXTERNA", "Externa"

    class StatusReserva(models.TextChoices):
        PENDING = "PENDING", "Pendente"
        APPROVED = "APPROVED", "Aprovada"
        REJECTED = "REJECTED", "Rejeitada"

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="reservations"
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
        return f"{self.room} - {self.data_inicio} ({self.status})"