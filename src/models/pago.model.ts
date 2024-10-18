import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Empleado} from './empleado.model';

@model(
  {
    settings: {
      foreignKeys: {
        fk_pago_idEmpleado: {
          name: 'fk_pago_idEmpleado',
          entity: 'Empleado',
          entityKey: 'id',
          foreignKey: 'empleadoId',
        },
      },
    },
  },

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

  @belongsTo(() => Empleado)
  empleadoId: number;

  constructor(data?: Partial<Pago>) {
    super(data);
  }
}

export interface PagoRelations {
  // describe navigational properties here
}

export type PagoWithRelations = Pago & PagoRelations;
