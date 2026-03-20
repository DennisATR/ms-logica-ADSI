import {Model, model, property} from '@loopback/repository';

@model()
export class ResumenDelDiaVentas extends Model {
  @property({
    type: 'string',
    required: true,
  })
  descripcion: string;

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

  constructor(data?: Partial<ResumenDelDiaVentas>) {
    super(data);
  }
}
