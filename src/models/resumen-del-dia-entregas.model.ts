import {Model, model, property} from '@loopback/repository';

@model()
export class ResumenDelDiaEntregas extends Model {
  @property({
    type: 'string',
    required: true,
  })
  empresa: string;

  @property({
    type: 'number',
    required: true,
  })
  cantidadCajas: number;

  @property({
    type: 'number',
    required: true,
  })
  cobro: number;

  constructor(data?: Partial<ResumenDelDiaEntregas>) {
    super(data);
  }
}
