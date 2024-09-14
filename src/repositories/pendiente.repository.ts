import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Pendiente, PendienteRelations, Venta} from '../models';
import {VentaRepository} from './venta.repository';

export class PendienteRepository extends DefaultCrudRepository<
  Pendiente,
  typeof Pendiente.prototype.id,
  PendienteRelations
> {

  public readonly venta: BelongsToAccessor<Venta, typeof Pendiente.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('VentaRepository') protected ventaRepositoryGetter: Getter<VentaRepository>,
  ) {
    super(Pendiente, dataSource);
    this.venta = this.createBelongsToAccessorFor('venta', ventaRepositoryGetter,);
    this.registerInclusionResolver('venta', this.venta.inclusionResolver);
  }
}
