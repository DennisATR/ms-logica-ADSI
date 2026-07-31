import {Entity, hasMany, model, property} from '@loopback/repository';
import {Factura} from './factura.model';
import {Pago} from './pago.model';

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
    type: 'string',
    required: true,
  })
  Clave: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaReg: string;

  @property({
    type: 'number',
  })
  usuarioId?: number;

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
