import {Entity, model, property, hasMany} from '@loopback/repository';
import {Venta} from './venta.model';

@model()
export class Almacen extends Entity {
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
  Nombre: string;

  @property({
    type: 'string',
    required: true,
  })
  Prefijo: string;

  @hasMany(() => Venta)
  ventas: Venta[];

  constructor(data?: Partial<Almacen>) {
    super(data);
  }
}

export interface AlmacenRelations {
  // describe navigational properties here
}

export type AlmacenWithRelations = Almacen & AlmacenRelations;
