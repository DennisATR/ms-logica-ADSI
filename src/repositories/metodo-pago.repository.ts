import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {MetodoPago, MetodoPagoRelations, Factura, CierreCajaMetodoPago} from '../models';
import {FacturaRepository} from './factura.repository';
import {CierreCajaMetodoPagoRepository} from './cierre-caja-metodo-pago.repository';

export class MetodoPagoRepository extends DefaultCrudRepository<
  MetodoPago,
  typeof MetodoPago.prototype.id,
  MetodoPagoRelations
> {

  public readonly facturas: HasManyRepositoryFactory<Factura, typeof MetodoPago.prototype.id>;

  public readonly cierreCajaMetodoPagos: HasManyRepositoryFactory<CierreCajaMetodoPago, typeof MetodoPago.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('FacturaRepository') protected facturaRepositoryGetter: Getter<FacturaRepository>, @repository.getter('CierreCajaMetodoPagoRepository') protected cierreCajaMetodoPagoRepositoryGetter: Getter<CierreCajaMetodoPagoRepository>,
  ) {
    super(MetodoPago, dataSource);
    this.cierreCajaMetodoPagos = this.createHasManyRepositoryFactoryFor('cierreCajaMetodoPagos', cierreCajaMetodoPagoRepositoryGetter,);
    this.registerInclusionResolver('cierreCajaMetodoPagos', this.cierreCajaMetodoPagos.inclusionResolver);
    this.facturas = this.createHasManyRepositoryFactoryFor('facturas', facturaRepositoryGetter,);
    this.registerInclusionResolver('facturas', this.facturas.inclusionResolver);
  }
}
