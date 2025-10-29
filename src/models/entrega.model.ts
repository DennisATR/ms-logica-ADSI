import {Entity, model, property} from '@loopback/repository';

@model()
export class Entrega extends Entity {
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
  Remitente?: string;

  @property({
    type: 'string',
    required: true,
  })
  EmpresaTrans: string;

  @property({
    type: 'number',
    required: true,
  })
  NumCajas: number;

  @property({
    type: 'number',
    required: true,
  })
  Cobro: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;

  @property({
    type: 'string',
  })
  Observacion?: string;


  constructor(data?: Partial<Entrega>) {
    super(data);
  }
}

export interface EntregaRelations {
  // describe navigational properties here
}

export type EntregaWithRelations = Entrega & EntregaRelations;
