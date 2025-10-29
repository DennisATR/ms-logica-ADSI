import {Entity, model, property, hasMany} from '@loopback/repository';
import {Pago} from './pago.model';
import {Factura} from './factura.model';

@model()
export class Vendedor extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  Nombre: string;

  @property({
    type: 'string',
    required: true,
  })
  Apellido: string;

  @property({
    type: 'string',
    required: true,
  })
  Telefono: string;

  @property({
    type: 'string',
  })
  Correo?: string;

  @property({
    type: 'date',
    required: true,
  })
  FechaReg: string;

  @hasMany(() => Pago)
  pagos: Pago[];

  @hasMany(() => Factura)
  facturas: Factura[];

  constructor(data?: Partial<Vendedor>) {
    super(data);
  }
}

export interface VendedorRelations {
  // describe navigational properties here
}

export type VendedorWithRelations = Vendedor & VendedorRelations;
