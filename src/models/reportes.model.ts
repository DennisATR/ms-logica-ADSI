import {Entity, model, property} from '@loopback/repository';

@model()
export class Reportes extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;

  @property({
    type: 'number',
  })
  NumArticulos?: number;

  @property({
    type: 'number',
  })
  Costos?: number;

  @property({
    type: 'number',
  })
  Ventas?: number;

  @property({
    type: 'number',
  })
  Ganancias?: number;

  @property({
    type: 'number',
  })
  Base?: number;


  constructor(data?: Partial<Reportes>) {
    super(data);
  }
}

export interface ReportesRelations {
  // describe navigational properties here
}

export type ReportesWithRelations = Reportes & ReportesRelations;
