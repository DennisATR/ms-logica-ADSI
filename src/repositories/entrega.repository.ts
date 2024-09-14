import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Entrega, EntregaRelations} from '../models';

export class EntregaRepository extends DefaultCrudRepository<
  Entrega,
  typeof Entrega.prototype.id,
  EntregaRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Entrega, dataSource);
  }
}
