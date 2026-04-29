import {Entity, model, property} from '@loopback/repository';

@model()
export class CreditoDetalle extends Entity {
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
  FechaLimitePago: string;

  @property({
    type: 'string',
    required: true,
  })
  Estado: string;

  @property({
    type: 'number',
    required: true,
  })
  ValorTotal: number;

  @property({
    type: 'number',
    required: true,
  })
  ValorAbonado: number;

  @property({
    type: 'number',
    required: true,
  })
  Saldo: number;

  @property({
    type: 'string',
    required: true,
  })
  ClienteNombre: string;

  @property({
    type: 'string',
    required: true,
  })
  ClienteApellido: string;

  @property({
    type: 'string',
    required: true,
  })
  ZapatoDescripcion: string;

  @property({
    type: 'number',
    required: true,
  })
  ZapatoTalla: number;

  @property({
    type: 'string',
    required: true,
  })
  ZapatoColor: string;

  @property({
    type: 'number',
    required: true,
  })
  FacturaId: number;

  constructor(data?: Partial<CreditoDetalle>) {
    super(data);
  }
}
