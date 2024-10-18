import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Venta} from './venta.model';

@model(
  {

    settings: {
      foreignKeys: {
        fk_ventaPendiente_id: {
          name: 'fk_ventaPendiente_id',
          entity: 'Venta',
          entityKey: 'id',
          foreignKey: 'ventaId',
        },
      },
    },
  },

)
export class Pendiente extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  Fecha: string;

  @property({
    type: 'boolean',
    required: true,
  })
  Estado: boolean;

  @belongsTo(() => Venta)
  ventaId: number;

  constructor(data?: Partial<Pendiente>) {
    super(data);
  }
}

export interface PendienteRelations {
  // describe navigational properties here
}

export type PendienteWithRelations = Pendiente & PendienteRelations;
