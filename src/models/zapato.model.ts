import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Factura} from './factura.model';
import {Proveedor} from './proveedor.model';
import {Venta} from './venta.model';

@model(
  {
    /**
    settings: {
      foreignKeys: {
        fk_zapato_proveedorId: {
          name: 'fk_zapato_proveedorId',
          entity: 'Proveedor',
          entityKey: 'id',
          foreignKey: 'proveedorId',
        },
      },
    },
      */
  }
)
export class Zapato extends Entity {
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
    type: 'string',
    required: false,
  })
  Color?: string;

  @property({
    type: 'number',
    required: true,
  })
  Cantidad: number;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  Fecha: string;

  @property({
    type: 'string',
    required: true,
  })
  Genero?: string;


  @hasMany(() => Factura, {through: {model: () => Venta}})
  facturas: Factura[];

  @belongsTo(() => Proveedor)
  proveedorId: number;

  @hasMany(() => Venta)
  ventas: Venta[];

  constructor(data?: Partial<Zapato>) {
    super(data);
  }
}

export interface ZapatoRelations {
  // describe navigational properties here
}

export type ZapatoWithRelations = Zapato & ZapatoRelations;
