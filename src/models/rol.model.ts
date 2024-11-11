import {Entity, model, property, hasMany} from '@loopback/repository';
import {Empleado} from './empleado.model';
import {Menu} from './menu.model';
import {MenuDelRol} from './menu-del-rol.model';

@model()
export class Rol extends Entity {
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
  Comentario: string;

  @hasMany(() => Empleado)
  empleados: Empleado[];

  @hasMany(() => Menu, {through: {model: () => MenuDelRol}})
  menus: Menu[];

  constructor(data?: Partial<Rol>) {
    super(data);
  }
}

export interface RolRelations {
  // describe navigational properties here
}

export type RolWithRelations = Rol & RolRelations;
