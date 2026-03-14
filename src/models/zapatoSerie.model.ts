import {Model, model, property} from '@loopback/repository';

@model()
export class ZapatoSerie extends Model {

  @property({
    type: 'string'
  })
  Prefijo: string;

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
    type: 'string',
    required: true,
  })
  Color: string;

  @property({
    type: 'string',
    required: true,
  })
  Referencia: string;

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
    type: 'any',
    required: true,
  })
  Cantidad: number | number[];

  @property({
    type: 'number',
    required: true,
  })
  TallaInicial: number;

  @property({
    type: 'number',
    required: true,
  })
  TallaFinal: number;

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
  proveedorId: number;

  @property({
    type: 'string',
    required: true,
  })
  Genero?: string;

  constructor(data?: Partial<ZapatoSerie>) {
    super(data);
  }
}
