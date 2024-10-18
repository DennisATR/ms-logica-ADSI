import {Entity, hasMany, model, property} from '@loopback/repository';
import {Factura} from './factura.model';
import {Pago} from './pago.model';

@model()
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

  @hasMany(() => Pago)
  pagos: Pago[];

  @hasMany(() => Factura)
  facturas: Factura[];

  constructor(data?: Partial<Empleado>) {
    super(data);
  }
}

export interface EmpleadoRelations {
  // describe navigational properties here
}

export type EmpleadoWithRelations = Empleado & EmpleadoRelations;
