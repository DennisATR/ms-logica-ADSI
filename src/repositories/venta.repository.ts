import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Almacen, Devolucion, Pendiente, Venta, VentaRelations, Zapato, Factura} from '../models';
import {AlmacenRepository} from './almacen.repository';
import {DevolucionRepository} from './devolucion.repository';
import {PendienteRepository} from './pendiente.repository';
import {ZapatoRepository} from './zapato.repository';
import {FacturaRepository} from './factura.repository';

export class VentaRepository extends DefaultCrudRepository<
  Venta,
  typeof Venta.prototype.id,
  VentaRelations
> {

  public readonly devolucions: HasManyRepositoryFactory<Devolucion, typeof Venta.prototype.id>;

  public readonly pendientes: HasManyRepositoryFactory<Pendiente, typeof Venta.prototype.id>;

  public readonly almacen: BelongsToAccessor<Almacen, typeof Venta.prototype.id>;

  public readonly zapato: BelongsToAccessor<Zapato, typeof Venta.prototype.id>;

  public readonly factura: BelongsToAccessor<Factura, typeof Venta.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('DevolucionRepository') protected devolucionRepositoryGetter: Getter<DevolucionRepository>, @repository.getter('PendienteRepository') protected pendienteRepositoryGetter: Getter<PendienteRepository>, @repository.getter('AlmacenRepository') protected almacenRepositoryGetter: Getter<AlmacenRepository>, @repository.getter('ZapatoRepository') protected zapatoRepositoryGetter: Getter<ZapatoRepository>, @repository.getter('FacturaRepository') protected facturaRepositoryGetter: Getter<FacturaRepository>,
  ) {
    super(Venta, dataSource);
    this.factura = this.createBelongsToAccessorFor('factura', facturaRepositoryGetter,);
    this.registerInclusionResolver('factura', this.factura.inclusionResolver);
    this.zapato = this.createBelongsToAccessorFor('zapato', zapatoRepositoryGetter,);
    this.registerInclusionResolver('zapato', this.zapato.inclusionResolver);
    this.almacen = this.createBelongsToAccessorFor('almacen', almacenRepositoryGetter,);
    this.registerInclusionResolver('almacen', this.almacen.inclusionResolver);
    this.pendientes = this.createHasManyRepositoryFactoryFor('pendientes', pendienteRepositoryGetter,);
    this.registerInclusionResolver('pendientes', this.pendientes.inclusionResolver);
    this.devolucions = this.createHasManyRepositoryFactoryFor('devolucions', devolucionRepositoryGetter,);
    this.registerInclusionResolver('devolucions', this.devolucions.inclusionResolver);
  }
}
