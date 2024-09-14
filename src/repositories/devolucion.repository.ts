import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Devolucion, DevolucionRelations} from '../models';

export class DevolucionRepository extends DefaultCrudRepository<
  Devolucion,
  typeof Devolucion.prototype.id,
  DevolucionRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Devolucion, dataSource);
  }
}
