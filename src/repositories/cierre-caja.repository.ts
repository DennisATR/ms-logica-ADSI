import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {CierreCaja, CierreCajaRelations, CierreCajaMetodoPago} from '../models';
import {CierreCajaMetodoPagoRepository} from './cierre-caja-metodo-pago.repository';

export class CierreCajaRepository extends DefaultCrudRepository<
  CierreCaja,
  typeof CierreCaja.prototype.id,
  CierreCajaRelations
> {

  public readonly cierreCajaMetodoPagos: HasManyRepositoryFactory<CierreCajaMetodoPago, typeof CierreCaja.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('CierreCajaMetodoPagoRepository') protected cierreCajaMetodoPagoRepositoryGetter: Getter<CierreCajaMetodoPagoRepository>,
  ) {
    super(CierreCaja, dataSource);
    this.cierreCajaMetodoPagos = this.createHasManyRepositoryFactoryFor('cierreCajaMetodoPagos', cierreCajaMetodoPagoRepositoryGetter,);
    this.registerInclusionResolver('cierreCajaMetodoPagos', this.cierreCajaMetodoPagos.inclusionResolver);
  }
}
