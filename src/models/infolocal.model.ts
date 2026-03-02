import {Entity, model, property} from '@loopback/repository';

@model()
export class Infolocal extends Entity {
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
  Direccion: string;

  @property({
    type: 'string',
    required: true,
  })
  NIT: string;

  @property({
    type: 'number',
  })
  Iva?: number;

  @property({
    type: 'string',
  })
  Mensaje?: string;

  @property({
    type: 'string',
  })
  Telefono?: string;

  @property({
    type: 'number',
    required: true,
  })
  almacenId?: number;

  constructor(data?: Partial<Infolocal>) {
    super(data);
  }
}

export interface InfolocalRelations {
  // describe navigational properties here
}

export type InfolocalWithRelations = Infolocal & InfolocalRelations;
