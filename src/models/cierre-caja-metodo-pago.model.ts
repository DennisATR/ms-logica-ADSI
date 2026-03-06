import {Entity, model, property, belongsTo} from '@loopback/repository';
import {CierreCaja} from './cierre-caja.model';
import {MetodoPago} from './metodo-pago.model';

@model()
export class CierreCajaMetodoPago extends Entity {
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
  Total: number;

  @belongsTo(() => CierreCaja)
  cierreCajaId: number;

  @belongsTo(() => MetodoPago)
  metodoPagoId: number;

  constructor(data?: Partial<CierreCajaMetodoPago>) {
    super(data);
  }
}

export interface CierreCajaMetodoPagoRelations {
  // describe navigational properties here
}

export type CierreCajaMetodoPagoWithRelations = CierreCajaMetodoPago & CierreCajaMetodoPagoRelations;
