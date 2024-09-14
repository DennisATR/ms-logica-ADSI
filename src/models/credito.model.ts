import {Entity, model, property} from '@loopback/repository';

@model()
export class Credito extends Entity {
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
  idFactura: number;

  @property({
    type: 'number',
    required: true,
  })
  Abono: number;

  @property({
    type: 'number',
    required: true,
  })
  Total: number;

  @property({
    type: 'boolean',
    required: true,
  })
  Estado: boolean;


  constructor(data?: Partial<Credito>) {
    super(data);
  }
}

export interface CreditoRelations {
  // describe navigational properties here
}

export type CreditoWithRelations = Credito & CreditoRelations;
