import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Pendiente, PendienteRelations} from '../models';

export class PendienteRepository extends DefaultCrudRepository<
  Pendiente,
  typeof Pendiente.prototype.id,
  PendienteRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Pendiente, dataSource);
  }
}
