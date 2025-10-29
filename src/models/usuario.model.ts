import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Login} from './login.model';
import {Rol} from './rol.model';

@model(
  {
    settings: {
      foreignKeys: {
        fk_usuario_rolId: {
          name: 'fk_usuario_rolId',
          entity: 'Rol',
          entityKey: 'id',
          foreignKey: 'rolId',
        },
      },
    },
  },
)
export class Usuario extends Entity {
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
  Nombre: string;

  @property({
    type: 'string',
    required: true,
  })
  Apellido: string;

  @property({
    type: 'string',
    required: true,
  })
  Telefono: string;

  @property({
    type: 'string',
    required: true,
  })
  Correo: string;

  @property({
    type: 'string',
    required: true,
  })
  Clave: string;

  @property({
    type: 'date',
    required: true,
  })
  FechaReg: string;

  @hasMany(() => Login)
  logins: Login[];

  @belongsTo(() => Rol)
  rolId: number;

  constructor(data?: Partial<Usuario>) {
    super(data);
  }
}

export interface UsuarioRelations {
  // describe navigational properties here
}

export type UsuarioWithRelations = Usuario & UsuarioRelations;
