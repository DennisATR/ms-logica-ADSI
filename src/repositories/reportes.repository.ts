import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MysqlDataSource} from '../datasources';
import {Reportes, ReportesRelations} from '../models';

export class ReportesRepository extends DefaultCrudRepository<
  Reportes,
  typeof Reportes.prototype.id,
  ReportesRelations
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Reportes, dataSource);
  }
}
