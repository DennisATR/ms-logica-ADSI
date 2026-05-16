import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Venta} from './venta.model';

@model(

  {
    /**
    settings: {
      foreignKeys: {
        fk_venta_id: {
          name: 'fk_venta_id',
          entity: 'Venta',
          entityKey: 'id',
          foreignKey: 'ventaId',
        },
      },
    },
      */
  },

)
export class Devolucion extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;


  @property({
    type: 'string',
    required: true,
  })
  Observacion: string;

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
  Cantidad: number;

  @belongsTo(() => Venta)
  ventaId: number;

  constructor(data?: Partial<Devolucion>) {
    super(data);
  }
}

export interface DevolucionRelations {
  // describe navigational properties here
}

export type DevolucionWithRelations = Devolucion & DevolucionRelations;
