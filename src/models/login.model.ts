import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Usuario} from './usuario.model';

@model(
  {
    /**
    settings: {
      foreignKeys: {
        fk_login_idUsuario: {
          name: 'fk_login_idUsuario',
          entity: 'Usuario',
          entityKey: 'id',
          foreignKey: 'usuarioId',
        },
      },
    },
      */
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
    type: 'string',
    required: true,
    mysql: {
      dataType: 'datetime',
    },
  })
  Fecha: string;

  @belongsTo(() => Usuario)
  usuarioId: number;

  constructor(data?: Partial<Login>) {
    super(data);
  }
}

export interface LoginRelations {
  // describe navigational properties here
}

export type LoginWithRelations = Login & LoginRelations;
