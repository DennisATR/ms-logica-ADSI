import {Entity, model, property} from '@loopback/repository';

@model()
export class Zapato extends Entity {
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
  Descripcion: string;

  @property({
    type: 'string',
    required: true,
  })
  Categoria: string;

  @property({
    type: 'number',
    required: true,
  })
  Talla: number;

  @property({
    type: 'string',
    required: true,
  })
  Color: string;

  @property({
    type: 'number',
    required: true,
  })
  idProveedor: number;

  @property({
    type: 'number',
    required: true,
  })
  Ganancia: number;

  @property({
    type: 'number',
    required: true,
  })
  PrecioCosto: number;

  @property({
    type: 'number',
    required: true,
  })
  PrecioVentaMax: number;

  @property({
    type: 'number',
    required: true,
  })
  PrecioVentaMin: number;

  @property({
    type: 'number',
    required: true,
  })
  Cantidad: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;


  constructor(data?: Partial<Zapato>) {
    super(data);
  }
}

export interface ZapatoRelations {
  // describe navigational properties here
}

export type ZapatoWithRelations = Zapato & ZapatoRelations;
