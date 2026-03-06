import {Entity, hasMany, model, property} from '@loopback/repository';
import {CierreCajaMetodoPago} from './cierre-caja-metodo-pago.model';

@model()
export class CierreCaja extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaHoraApertura: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaHoraCierre: string;

  @property({
    type: 'number',
  })
  NumeroArticulos?: number;

  @property({
    type: 'number',
  })
  Base?: number;

  @property({
    type: 'number',
  })
  TotalVentas?: number;

  @property({
    type: 'number',
  })
  MontoEsperado?: number;

  @property({
    type: 'number',
  })
  MontoReal?: number;

  @property({
    type: 'number',
  })
  Diferencia?: number;

  @property({
    type: 'string',
  })
  Estado?: string;

  @hasMany(() => CierreCajaMetodoPago)
  cierreCajaMetodoPagos: CierreCajaMetodoPago[];

  constructor(data?: Partial<CierreCaja>) {
    super(data);
  }
}

export interface CierreCajaRelations {
  // describe navigational properties here
}

export type CierreCajaWithRelations = CierreCaja & CierreCajaRelations;
