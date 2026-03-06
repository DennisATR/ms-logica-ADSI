import {Entity, model, property, hasMany} from '@loopback/repository';
import {Factura} from './factura.model';
import {CierreCajaMetodoPago} from './cierre-caja-metodo-pago.model';

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

  @hasMany(() => Factura)
  facturas: Factura[];

  @hasMany(() => CierreCajaMetodoPago)
  cierreCajaMetodoPagos: CierreCajaMetodoPago[];

  constructor(data?: Partial<MetodoPago>) {
    super(data);
  }
}

export interface MetodoPagoRelations {
  // describe navigational properties here
}

export type MetodoPagoWithRelations = MetodoPago & MetodoPagoRelations;
