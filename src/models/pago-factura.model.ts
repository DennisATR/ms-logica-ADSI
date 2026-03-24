import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Factura} from './factura.model';
import {MetodoPago} from './metodo-pago.model';

@model()
export class PagoFactura extends Entity {
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
  Monto: number;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  Fecha: string;

  @belongsTo(() => Factura)
  facturaId: number;

  @belongsTo(() => MetodoPago)
  metodoPagoId: number;

  constructor(data?: Partial<PagoFactura>) {
    super(data);
  }
}

export interface PagoFacturaRelations {
  // describe navigational properties here
}

export type PagoFacturaWithRelations = PagoFactura & PagoFacturaRelations;
