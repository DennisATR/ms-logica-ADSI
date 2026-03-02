import {Entity, model, property} from '@loopback/repository';

@model()
export class Informacion extends Entity {
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
    type: 'string',
    required: true,
  })
  Prefijo?: string;

  constructor(data?: Partial<Informacion>) {
    super(data);
  }
}
