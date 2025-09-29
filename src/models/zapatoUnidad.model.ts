import {Model, model, property} from '@loopback/repository';

@model()
export class ZapatoUnidad extends Model {
  @property({
    type: 'string',
    id: true
  })
  id?: string;

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
  Ganancia: number;

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
    type: 'number',
    required: true,
  })
  Cantidad: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;

  @property({
    type:'number',
    required: true,
  })
  proveedorId: number;

  constructor(data?: Partial<ZapatoUnidad>) {
    super(data);
  }
}
