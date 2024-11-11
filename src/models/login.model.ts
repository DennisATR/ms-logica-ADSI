import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Empleado} from './empleado.model';

@model(
  {
    settings: {
      foreignKeys: {
        fk_login_idEmpleado: {
          name: 'fk_login_idEmpleado',
          entity: 'Empleado',
          entityKey: 'id',
          foreignKey: 'empleadoId',
        },
      },
    },
  },
)
export class Login extends Entity {
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

  @belongsTo(() => Empleado)
  empleadoId: number;

  constructor(data?: Partial<Login>) {
    super(data);
  }
}

export interface LoginRelations {
  // describe navigational properties here
}

export type LoginWithRelations = Login & LoginRelations;
