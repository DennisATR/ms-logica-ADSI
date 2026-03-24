import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {CierreCajaMetodoPago, MetodoPago, MetodoPagoRelations, PagoFactura} from '../models';
import {CierreCajaMetodoPagoRepository} from './cierre-caja-metodo-pago.repository';
import {PagoFacturaRepository} from './pago-factura.repository';

export class MetodoPagoRepository extends DefaultCrudRepository<
  MetodoPago,
  typeof MetodoPago.prototype.id,
  MetodoPagoRelations
> {

  public readonly cierreCajaMetodoPagos: HasManyRepositoryFactory<CierreCajaMetodoPago, typeof MetodoPago.prototype.id>;

  public readonly pagoFacturas: HasManyRepositoryFactory<PagoFactura, typeof MetodoPago.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('CierreCajaMetodoPagoRepository') protected cierreCajaMetodoPagoRepositoryGetter: Getter<CierreCajaMetodoPagoRepository>, @repository.getter('PagoFacturaRepository') protected pagoFacturaRepositoryGetter: Getter<PagoFacturaRepository>,
  ) {
    super(MetodoPago, dataSource);
    this.pagoFacturas = this.createHasManyRepositoryFactoryFor('pagoFacturas', pagoFacturaRepositoryGetter,);
    this.registerInclusionResolver('pagoFacturas', this.pagoFacturas.inclusionResolver);
    this.cierreCajaMetodoPagos = this.createHasManyRepositoryFactoryFor('cierreCajaMetodoPagos', cierreCajaMetodoPagoRepositoryGetter,);
    this.registerInclusionResolver('cierreCajaMetodoPagos', this.cierreCajaMetodoPagos.inclusionResolver);
  }
}
