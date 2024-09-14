import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Venta} from './venta.model';

@model()
export class Devolucion extends Entity {
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
    type: 'string',
    required: true,
  })
  Observacion: string;

  @belongsTo(() => Venta)
  ventaId: number;

  constructor(data?: Partial<Devolucion>) {
    super(data);
  }
}

export interface DevolucionRelations {
  // describe navigational properties here
}

export type DevolucionWithRelations = Devolucion & DevolucionRelations;
