import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {CierreCajaMetodoPago, CierreCajaMetodoPagoRelations, CierreCaja, MetodoPago} from '../models';
import {CierreCajaRepository} from './cierre-caja.repository';
import {MetodoPagoRepository} from './metodo-pago.repository';

export class CierreCajaMetodoPagoRepository extends DefaultCrudRepository<
  CierreCajaMetodoPago,
  typeof CierreCajaMetodoPago.prototype.id,
  CierreCajaMetodoPagoRelations
> {

  public readonly cierreCaja: BelongsToAccessor<CierreCaja, typeof CierreCajaMetodoPago.prototype.id>;

  public readonly metodoPago: BelongsToAccessor<MetodoPago, typeof CierreCajaMetodoPago.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('CierreCajaRepository') protected cierreCajaRepositoryGetter: Getter<CierreCajaRepository>, @repository.getter('MetodoPagoRepository') protected metodoPagoRepositoryGetter: Getter<MetodoPagoRepository>,
  ) {
    super(CierreCajaMetodoPago, dataSource);
    this.metodoPago = this.createBelongsToAccessorFor('metodoPago', metodoPagoRepositoryGetter,);
    this.registerInclusionResolver('metodoPago', this.metodoPago.inclusionResolver);
    this.cierreCaja = this.createBelongsToAccessorFor('cierreCaja', cierreCajaRepositoryGetter,);
    this.registerInclusionResolver('cierreCaja', this.cierreCaja.inclusionResolver);
  }
}
