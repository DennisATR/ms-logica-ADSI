import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Cliente} from './cliente.model';
import {Credito} from './credito.model';
import {Empleado} from './empleado.model';
import {MetodoPago} from './metodo-pago.model';
import {Venta} from './venta.model';
import {Zapato} from './zapato.model';

@model(
  {
    settings: {
      foreignKeys: {
        fk_factura_idCliente: {
          name: 'fk_factura_idCliente',
          entity: 'Cliente',
          entityKey: 'id',
          foreignKey: 'clienteId',
        },
        fk_factura_idMetodoPago: {
          name: 'fk_factura_idMetodoPago',
          entity: 'MetodoPago',
          entityKey: 'id',
          foreignKey: 'metodoPagoId',
        },
        fk_factura_idEmpleado: {
          name: 'fk_factura_idEmpleado',
          entity: 'Empleado',
          entityKey: 'id',
          foreignKey: 'empleadoId',
        },
      },
    },
  },

)
export class Factura extends Entity {
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
  Nota?: string;

  @belongsTo(() => MetodoPago)
  metodoPagoId: number;

  @hasMany(() => Zapato, {through: {model: () => Venta}})
  zapatos: Zapato[];

  @hasMany(() => Credito)
  creditos: Credito[];

  @belongsTo(() => Cliente)
  clienteId: number;

  @belongsTo(() => Empleado)
  empleadoId: number;

  constructor(data?: Partial<Factura>) {
    super(data);
  }
}

export interface FacturaRelations {
  // describe navigational properties here
}

export type FacturaWithRelations = Factura & FacturaRelations;
