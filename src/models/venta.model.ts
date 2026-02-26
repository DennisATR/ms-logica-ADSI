import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Almacen} from './almacen.model';
import {Devolucion} from './devolucion.model';
import {Factura} from './factura.model';
import {Pendiente} from './pendiente.model';
import {Zapato} from './zapato.model';

@model(
  {
    /**
    settings: {
      foreignKeys: {
        fk_venta_facturaId: {
          name: 'fk_venta_facturaId',
          entity: 'Factura',
          entityKey: 'id',
          foreignKey: 'facturaId',
        },
        fk_venta_zapatoId: {
          name: 'fk_venta_zapatoId',
          entity: 'Zapato',
          entityKey: 'id',
          foreignKey: 'zapatoId',
        },
      },
    },
      */
  },

)
export class Venta extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  Cantidad: number;

  @property({
    type: 'number',
    required: true,
  })
  Precio: number;

  @belongsTo(() => Almacen)
  almacenId: number;

  @belongsTo(() => Zapato)
  zapatoId: string;

  @belongsTo(() => Factura)
  facturaId: number;

  @hasMany(() => Devolucion)
  devolucions: Devolucion[];

  @hasMany(() => Pendiente)
  pendientes: Pendiente[];

  constructor(data?: Partial<Venta>) {
    super(data);
  }
}

export interface VentaRelations {
  // describe navigational properties here
}

export type VentaWithRelations = Venta & VentaRelations;
