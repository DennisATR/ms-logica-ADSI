import {Entity, hasMany, model, property} from '@loopback/repository';
import {CierreCajaMetodoPago} from './cierre-caja-metodo-pago.model';
import {PagoFactura} from './pago-factura.model';

@model()
export class MetodoPago extends Entity {
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
  Descripcion: string;

  @hasMany(() => CierreCajaMetodoPago)
  cierreCajaMetodoPagos: CierreCajaMetodoPago[];

  @hasMany(() => PagoFactura)
  pagoFacturas: PagoFactura[];

  constructor(data?: Partial<MetodoPago>) {
    super(data);
  }
}

export interface MetodoPagoRelations {
  // describe navigational properties here
}

export type MetodoPagoWithRelations = MetodoPago & MetodoPagoRelations;
