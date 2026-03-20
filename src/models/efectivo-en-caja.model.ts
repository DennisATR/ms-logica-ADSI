import {Model, model, property} from '@loopback/repository';

@model()
export class EfectivoEnCaja extends Model {
  @property({
    type: 'string',
    required: true,
  })
  fecha: string;

  @property({
    type: 'number',
    required: true,
  })
  ventasEfectivo: number;

  @property({
    type: 'number',
    required: true,
  })
  base: number;

  @property({
    type: 'number',
    required: true,
  })
  gastos: number;

  @property({
    type: 'number',
    required: true,
  })
  entrega: number;

  @property({
    type: 'number',
    required: true,
  })
  efectivoEnCaja: number;

  @property({
    type: 'number',
    required: true,
  })
  quedaEnCaja?: number;

  constructor(data?: Partial<EfectivoEnCaja>) {
    super(data);
  }
}
