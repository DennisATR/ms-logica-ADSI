import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Vendedor} from './vendedor.model';

@model(
  {
    /**
    settings: {
      foreignKeys: {
        fk_pago_idVendedor: {
          name: 'fk_pago_idVendedor',
          entity: 'Vendedor',
          entityKey: 'id',
          foreignKey: 'vendedorId',
        },
      },
    },
  },
      */}

)
export class Pago extends Entity {
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
    type: 'number',
    required: true,
  })
  Total: number;

  @property({
    type: 'string',
  })
  Observacion?: string;

  @belongsTo(() => Vendedor)
  vendedorId: string;

  constructor(data?: Partial<Pago>) {
    super(data);
  }
}

export interface PagoRelations {
  // describe navigational properties here
}

export type PagoWithRelations = Pago & PagoRelations;
