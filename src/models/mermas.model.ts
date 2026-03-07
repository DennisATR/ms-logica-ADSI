import {Entity, model, property} from '@loopback/repository';

@model()
export class Mermas extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  Fecha: string;

  @property({
    type: 'number',
    required: true,
  })
  Valor: number;

  @property({
    type: 'string',
    required: true,
  })
  Concepto: string;


  constructor(data?: Partial<Mermas>) {
    super(data);
  }
}

export interface MermasRelations {
  // describe navigational properties here
}

export type MermasWithRelations = Mermas & MermasRelations;
