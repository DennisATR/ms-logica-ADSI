import {Entity, model, property} from '@loopback/repository';

@model()
export class Proveedor extends Entity {
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
  NIT: string;

  @property({
    type: 'string',
    required: true,
  })
  Nombre: string;

  @property({
    type: 'string',
    required: true,
  })
  Empresa: string;

  @property({
    type: 'string',
  })
  Telefono?: string;

  @property({
    type: 'string',
  })
  Ciudad?: string;

  @property({
    type: 'string',
  })
  Correo?: string;


  constructor(data?: Partial<Proveedor>) {
    super(data);
  }
}

export interface ProveedorRelations {
  // describe navigational properties here
}

export type ProveedorWithRelations = Proveedor & ProveedorRelations;
