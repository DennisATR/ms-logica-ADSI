import {repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {Notificacion} from '../models';
import {NotificacionRepository, ZapatoRepository} from '../repositories';

export class NotificacionController {
  constructor(
    @repository(NotificacionRepository)
    public notificacionRepository: NotificacionRepository,
    @repository(ZapatoRepository)
    public zapatoRepository: ZapatoRepository,
  ) {}

  @post('/notificacion/verificar-exhibicion')
  @response(200, {
    description: 'Verificar si el zapato vendido corresponde a exhibición y crear notificación silenciosa',
    content: {'application/json': {schema: {type: 'object'}}},
  })
  async verificarExhibicion(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              zapatoId: {type: 'string'},
              cantidad: {type: 'number'},
            },
            required: ['zapatoId'],
          },
        },
      },
    })
    datos: {zapatoId: string; cantidad?: number},
  ): Promise<{esExhibicion: boolean; notificacion?: Notificacion}> {
    const zapatoVendido = await this.zapatoRepository.findOne({
      where: {id: datos.zapatoId},
    });

    if (!zapatoVendido || !zapatoVendido.Talla) {
      return {esExhibicion: false};
    }

    // Buscar zapatos de la misma serie (misma descripción y color)
    const zapatosSerie = await this.zapatoRepository.find({
      where: {
        Descripcion: zapatoVendido.Descripcion,
        Color: zapatoVendido.Color,
      },
    });

    if (!zapatosSerie || zapatosSerie.length === 0) {
      return {esExhibicion: false};
    }

    // Obtener todas las tallas disponibles (cantidad > 0 o la talla vendida)
    const tallasDisponibles = zapatosSerie
      .filter(z => (z.Cantidad ?? 0) > 0 || z.id === zapatoVendido.id)
      .map(z => z.Talla!)
      .filter(talla => typeof talla === 'number');

    if (tallasDisponibles.length === 0) {
      return {esExhibicion: false};
    }

    const tallaMinima = Math.min(...tallasDisponibles);

    // Si la talla vendida es la menor en stock disponible
    if (zapatoVendido.Talla === tallaMinima) {
      // Buscar la siguiente talla disponible mayor a la vendida
      const siguientesTallas = zapatosSerie
        .filter(z => z.id !== zapatoVendido.id && (z.Cantidad ?? 0) > 0 && (z.Talla ?? 0) > zapatoVendido.Talla!)
        .sort((a, b) => (a.Talla ?? 0) - (b.Talla ?? 0));

      const siguienteTalla = siguientesTallas.length > 0 ? siguientesTallas[0].Talla : undefined;

      const FechaHoraActual = new Date().toLocaleString('sv-SE', {timeZone: 'America/Bogota'});

      const nuevaNotificacion = await this.notificacionRepository.create({
        zapatoId: zapatoVendido.id,
        referenciaBase: (zapatoVendido as any).Referencia || zapatoVendido.id,
        descripcion: `${zapatoVendido.Descripcion} - ${zapatoVendido.Color}`,
        tallaVendida: zapatoVendido.Talla,
        tallaSiguienteExhibicion: siguienteTalla,
        FechaHora: FechaHoraActual,
        Estado: 'pendiente',
      });

      return {
        esExhibicion: true,
        notificacion: nuevaNotificacion,
      };
    }

    return {esExhibicion: false};
  }

  @get('/notificacion/pendientes')
  @response(200, {
    description: 'Obtener notificaciones pendientes con antigüedad máxima de 7 días',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Notificacion),
        },
      },
    },
  })
  async obtenerPendientes(): Promise<Notificacion[]> {
    const haceSieteDias = new Date();
    haceSieteDias.setDate(haceSieteDias.getDate() - 7);
    const fechaCorteStr = haceSieteDias.toLocaleString('sv-SE', {timeZone: 'America/Bogota'});

    // Limpieza automática de notificaciones antiguas (> 7 días)
    try {
      await this.notificacionRepository.deleteAll({
        FechaHora: {lt: fechaCorteStr},
      });
    } catch (e) {
      console.error('Error al limpiar notificaciones obsoletas:', e);
    }

    // Retornar notificaciones pendientes
    return this.notificacionRepository.find({
      where: {
        Estado: 'pendiente',
        FechaHora: {gte: fechaCorteStr},
      },
      order: ['FechaHora DESC'],
    });
  }

  @get('/notificacion/hoy')
  @response(200, {
    description: 'Obtener todas las notificaciones generadas el día de hoy',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Notificacion),
        },
      },
    },
  })
  async obtenerNotificacionesHoy(): Promise<Notificacion[]> {
    const ahora = new Date();
    const fechaHoyStr = ahora.toLocaleString('sv-SE', {timeZone: 'America/Bogota'}).split(' ')[0];

    return this.notificacionRepository.find({
      where: {
        FechaHora: {like: `${fechaHoyStr}%`},
      },
      order: ['FechaHora DESC'],
    });
  }

  @patch('/notificacion/{id}/aceptar')
  @response(200, {
    description: 'Marcar una notificación como atendida',
  })
  async aceptarNotificacion(
    @param.path.number('id') id: number,
  ): Promise<{success: boolean}> {
    await this.notificacionRepository.updateById(id, {Estado: 'atendida'});
    return {success: true};
  }
}
