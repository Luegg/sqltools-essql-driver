import { IBaseQueries } from '@sqltools/types';
import queryFactory from '@sqltools/base-driver/dist/lib/factory';

const describeTable: IBaseQueries['describeTable'] = queryFactory`
DESCRIBE ${p => p.label}
`;

const fetchColumns: IBaseQueries['fetchColumns'] = queryFactory`???`;

const fetchRecords: IBaseQueries['fetchRecords'] = queryFactory`
SELECT *
FROM ${p => (p.table.label || p.table)}
LIMIT ${p => p.limit || 50}
`;

const countRecords: IBaseQueries['countRecords'] = queryFactory`
SELECT count(1) AS total
FROM ${p => (p.table.label || p.table)}
`;

const fetchTables: IBaseQueries['fetchTables'] = queryFactory`???`;

const searchTables: IBaseQueries['searchTables'] = queryFactory`???`;

const searchColumns: IBaseQueries['searchColumns'] = queryFactory`???`;

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  searchTables,
  searchColumns
}
