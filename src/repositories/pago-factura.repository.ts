import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {PagoFactura, PagoFacturaRelations, Factura, MetodoPago} from '../models';
import {FacturaRepository} from './factura.repository';
import {MetodoPagoRepository} from './metodo-pago.repository';

export class PagoFacturaRepository extends DefaultCrudRepository<
  PagoFactura,
  typeof PagoFactura.prototype.id,
  PagoFacturaRelations
> {

  public readonly factura: BelongsToAccessor<Factura, typeof PagoFactura.prototype.id>;

  public readonly metodoPago: BelongsToAccessor<MetodoPago, typeof PagoFactura.prototype.id>;

  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource, @repository.getter('FacturaRepository') protected facturaRepositoryGetter: Getter<FacturaRepository>, @repository.getter('MetodoPagoRepository') protected metodoPagoRepositoryGetter: Getter<MetodoPagoRepository>,
  ) {
    super(PagoFactura, dataSource);
    this.metodoPago = this.createBelongsToAccessorFor('metodoPago', metodoPagoRepositoryGetter,);
    this.registerInclusionResolver('metodoPago', this.metodoPago.inclusionResolver);
    this.factura = this.createBelongsToAccessorFor('factura', facturaRepositoryGetter,);
    this.registerInclusionResolver('factura', this.factura.inclusionResolver);
  }
}
