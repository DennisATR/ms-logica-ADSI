import {Entity, model, property, hasMany} from '@loopback/repository';
import {Zapato} from './zapato.model';
import {Cuenta} from './cuenta.model';

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

  @hasMany(() => Zapato)
  zapatos: Zapato[];

  @hasMany(() => Cuenta)
  cuentas: Cuenta[];

  constructor(data?: Partial<Proveedor>) {
    super(data);
  }
}

export interface ProveedorRelations {
  // describe navigational properties here
}

export type ProveedorWithRelations = Proveedor & ProveedorRelations;
