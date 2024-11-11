import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Factura} from './factura.model';
import {Login} from './login.model';
import {Pago} from './pago.model';
import {Rol} from './rol.model';

@model(
  {
    settings: {
      foreignKeys: {
        fk_empleado_rolId: {
          name: 'fk_empleado_rolId',
          entity: 'Rol',
          entityKey: 'id',
          foreignKey: 'rolId',
        },
      },
    },
  },
)
export class Empleado extends Entity {
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
  Telefono: string;

  @property({
    type: 'date',
    required: true,
  })
  FechaReg: string;

  @property({
    type: 'string',
    required: true,
  })
  Apellido: string;

  @property({
    type: 'string',
    required: true,
  })
  Clave: string;

  @property({
    type: 'string',
  })
  Correo?: string;


  @hasMany(() => Pago)
  pagos: Pago[];

  @hasMany(() => Factura)
  facturas: Factura[];

  @belongsTo(() => Rol)
  rolId: number;

  @hasMany(() => Login)
  logins: Login[];

  constructor(data?: Partial<Empleado>) {
    super(data);
  }
}

export interface EmpleadoRelations {
  // describe navigational properties here
}

export type EmpleadoWithRelations = Empleado & EmpleadoRelations;
