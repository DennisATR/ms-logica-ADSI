import {Entity, hasMany, model, property} from '@loopback/repository';
import {Factura} from './factura.model';

@model()
export class Cliente extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  Identificacion: string;

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
  Ciudad?: string;

  @property({
    type: 'string',
  })
  Barrio?: string;

  @property({
    type: 'string',
  })
  Correo?: string;

  @property({
    type: 'string',
  })
  Telefono?: string;

  @property({
    type: 'date',
  })
  FechaNac?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaReg?: string;

  @hasMany(() => Factura)
  facturas: Factura[];

  constructor(data?: Partial<Cliente>) {
    super(data);
  }
}

export interface ClienteRelations {
  // describe navigational properties here
}

export type ClienteWithRelations = Cliente & ClienteRelations;
