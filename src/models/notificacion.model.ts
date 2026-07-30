import {Entity, model, property} from '@loopback/repository';

@model()
export class Notificacion extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  zapatoId: string;

  @property({
    type: 'string',
  })
  referenciaBase?: string;

  @property({
    type: 'string',
  })
  descripcion?: string;

  @property({
    type: 'number',
    required: true,
  })
  tallaVendida: number;

  @property({
    type: 'number',
  })
  tallaSiguienteExhibicion?: number;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaHora: string;

  @property({
    type: 'string',
    default: 'pendiente',
  })
  Estado: string;

  constructor(data?: Partial<Notificacion>) {
    super(data);
  }
}

export interface NotificacionRelations {
  // describe navigational properties here
}

export type NotificacionWithRelations = Notificacion & NotificacionRelations;
