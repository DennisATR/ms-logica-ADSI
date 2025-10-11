import {Entity, model, property} from '@loopback/repository';

@model()
export class Gastos extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;

  @property({
    type: 'number',
    required: true,
  })
  Valor: number;

  @property({
    type: 'string',
    required: true,
  })
  Concepto: string;

  @property({
    type: 'string'
  })
  Descripcion: string;


  constructor(data?: Partial<Gastos>) {
    super(data);
  }
}

export interface GastosRelations {
  // describe navigational properties here
}

export type GastosWithRelations = Gastos & GastosRelations;
