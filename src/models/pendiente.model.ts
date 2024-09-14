import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Venta} from './venta.model';

@model()
export class Pendiente extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  idVenta: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;

  @property({
    type: 'boolean',
    required: true,
  })
  Estado: boolean;

  @belongsTo(() => Venta)
  ventaId: number;

  constructor(data?: Partial<Pendiente>) {
    super(data);
  }
}

export interface PendienteRelations {
  // describe navigational properties here
}

export type PendienteWithRelations = Pendiente & PendienteRelations;
