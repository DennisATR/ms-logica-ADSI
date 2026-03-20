import {Model, model, property} from '@loopback/repository';

@model()
export class ResumenDelDiaGastos extends Model {
  @property({
    type: 'string',
    required: true,
  })
  concepto: string;

  @property({
    type: 'number',
    required: true,
  })
  cantidad: number;

  @property({
    type: 'number',
    required: true,
  })
  valor: number;

  constructor(data?: Partial<ResumenDelDiaGastos>) {
    super(data);
  }
}
