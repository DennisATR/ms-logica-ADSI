import {Entity, model, property} from '@loopback/repository';

@model()
export class Cuenta extends Entity {
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
  idProveedor: number;

  @property({
    type: 'number',
    required: true,
  })
  Deuda: number;

  @property({
    type: 'number',
    required: true,
  })
  NumeroPares: number;

  @property({
    type: 'date',
    required: true,
  })
  FechaReg: string;

  @property({
    type: 'date',
    required: true,
  })
  FechaVen: string;

  @property({
    type: 'date',
  })
  FechaPago?: string;

  @property({
    type: 'number',
  })
  Abono?: number;

  @property({
    type: 'boolean',
    required: true,
  })
  Estado: boolean;


  constructor(data?: Partial<Cuenta>) {
    super(data);
  }
}

export interface CuentaRelations {
  // describe navigational properties here
}

export type CuentaWithRelations = Cuenta & CuentaRelations;
