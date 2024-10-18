import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Factura} from './factura.model';

@model(
  {
    settings: {
      foreignKeys: {
        fk_credito_idFactura: {
          name: 'fk_credito_facturaId',
          entity: 'Factura',
          entityKey: 'id',
          foreignKey: 'facturaId',
        },
      },
    },
  }
)
export class Credito extends Entity {
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
  Abono: number;

  @property({
    type: 'number',
    required: true,
  })
  Total: number;

  @property({
    type: 'boolean',
    required: true,
  })
  Estado: boolean;

  @belongsTo(() => Factura)
  facturaId: number;

  constructor(data?: Partial<Credito>) {
    super(data);
  }
}

export interface CreditoRelations {
  // describe navigational properties here
}

export type CreditoWithRelations = Credito & CreditoRelations;
