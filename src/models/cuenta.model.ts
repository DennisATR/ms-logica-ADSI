import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Proveedor} from './proveedor.model';

@model(
  {
    /**
    settings: {
      foreignKeys: {
        fk_proveedor_id: {
          name: 'fk_proveedor_id_cuenta',
          entity: 'Proveedor',
          entityKey: 'id',
          foreignKey: 'proveedorId',
        },
      },
    },
      */
  }
)
export class Cuenta extends Entity {
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
  Deuda: number;

  @property({
    type: 'number',
    required: true,
  })
  NumeroPares: number;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaReg: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaVen: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'datetime',
    },
  })
  FechaPago?: string;

  @property({
    type: 'number',
  })
  Abono?: number;

  @property({
    type: 'boolean',
    required: true,
  })
  Estado: boolean;

  @belongsTo(() => Proveedor)
  proveedorId: number;

  constructor(data?: Partial<Cuenta>) {
    super(data);
  }
}

export interface CuentaRelations {
  // describe navigational properties here
}

export type CuentaWithRelations = Cuenta & CuentaRelations;
