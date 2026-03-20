import {Model, model, property} from '@loopback/repository';

@model()
export class ResumenDelDiaMetodoPago extends Model {
  @property({
    type: 'string',
    required: true,
  })
  nombre: string;

  @property({
    type: 'number',
    required: true,
  })
  valor: number;

  constructor(data?: Partial<ResumenDelDiaMetodoPago>) {
    super(data);
  }
}
