import {Model, model, property} from '@loopback/repository';

@model()
export class EfectivoEnCaja extends Model {
  @property({
    type: 'string',
    required: true,
  })
  fecha: string;

  @property({
    type: 'number',
    required: true,
  })
  ventasEfectivo: number;

  @property({
    type: 'number',
    required: true,
  })
  base: number;

  @property({
    type: 'number',
    required: true,
  })
  gastos: number;

  @property({
    type: 'number',
    required: true,
  })
  entrega: number;

  @property({
    type: 'number',
    required: true,
  })
  efectivoEnCaja: number;

  @property({
    type: 'number',
    required: true,
  })
  quedaEnCaja?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  resumenVentas?: any[];

  @property({
    type: 'number',
  })
  totalVentas?: number;

  @property({
    type: 'number',
  })
  totalZapatosVendidos?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  resumenMetodoPago?: any[];

  @property({
    type: 'number',
  })
  totalMetodoPago?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  detalleGastos?: any[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  detalleEntregas?: any[];

  @property({
    type: 'number',
  })
  TotalReembolsos?: number;

  @property({
    type: 'number',
  })
  devoluciones?: number;

  @property({
    type: 'number',
  })
  credito?: number;

  @property({
    type: 'number',
  })
  abonos?: number;

  constructor(data?: Partial<EfectivoEnCaja>) {
    super(data);
  }
}
