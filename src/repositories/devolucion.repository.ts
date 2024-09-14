import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Devolucion, DevolucionRelations, Venta} from '../models';
import {VentaRepository} from './venta.repository';

export class DevolucionRepository extends DefaultCrudRepository<
  Devolucion,
  typeof Devolucion.prototype.id,
  DevolucionRelations
> {

  public readonly venta: BelongsToAccessor<Venta, typeof Devolucion.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('VentaRepository') protected ventaRepositoryGetter: Getter<VentaRepository>,
  ) {
    super(Devolucion, dataSource);
    this.venta = this.createBelongsToAccessorFor('venta', ventaRepositoryGetter,);
    this.registerInclusionResolver('venta', this.venta.inclusionResolver);
  }
}
