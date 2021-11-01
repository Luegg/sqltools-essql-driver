import { Client } from '@elastic/elasticsearch';
import AbstractDriver from '@sqltools/base-driver';
import queryFactory from '@sqltools/base-driver/dist/lib/factory';
import { Arg0, ContextValue, IConnectionDriver, NSDatabase } from '@sqltools/types';
import { v4 as generateId } from 'uuid';
import queries from './queries';

export default class EsSqlDriver extends AbstractDriver<Client, any> implements IConnectionDriver {

  queries = queries;

  public async open() {
    if (this.connection) {
      return this.connection;
    }

    const client = new Client({
      node: `http://${this.credentials.server}:${this.credentials.port}`
    });

    this.connection = Promise.resolve(client);
    return this.connection;
  }

  public async close() {
    if (!this.connection) return Promise.resolve();

    await (await this.connection).close()
    this.connection = null;
  }

  public query: (typeof AbstractDriver)['prototype']['query'] = async (queries, opt = {}) => {
    const db = await this.open();
    const queriesResults = await db.sql.query({ format: "json", body: { query: queries } });
    const cols = queriesResults.body.columns.map(c => c.name);

    return [<NSDatabase.IResult>{
      cols: cols,
      connId: this.getId(),
      messages: [{ date: new Date(), message: `Query ok with ${queriesResults.body.rows.length} results` }],
      results: queriesResults.body.rows.map((row) => {
        const rowDict = {};
        row.forEach((c, i) => {
          rowDict[cols[i]] = c;
        });
        return rowDict;
      }),
      query: queries.toString(),
      requestId: opt.requestId,
      resultId: generateId(),
    }];
  }

  public async testConnection() {
    await this.open();
    await this.query('SELECT 1', {});
  }

  public async getChildrenForItem({ item }: Arg0<IConnectionDriver['getChildrenForItem']>) {
    switch (item.type) {
      case ContextValue.CONNECTION:
      case ContextValue.CONNECTED_CONNECTION:
        return this.searchTables('');
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        return this.searchColumns('', (item as NSDatabase.ITable).label);
    }
    return [];
  }

  private async searchTables(search: string): Promise<NSDatabase.ITable[]> {
    return ((await this.queryResults<any>(queryFactory<{ search: string }>`show tables like '${p => p.search}%'`({ search }))).map(row =>
      <NSDatabase.ITable>{
        label: row.name,
        type: row.type == 'VIEW' ? ContextValue.VIEW : ContextValue.TABLE,
        isView: row.type == 'VIEW'
      }));
  }

  private async searchColumns(search: string, table: string): Promise<NSDatabase.IColumn[]> {
    return ((await this.queryResults<any>(queryFactory<{ table: string, search: string }>`show columns in "${p => p.table}"`({ table, search })))
      .filter(row => row.column.startsWith(search))
      .map(row =>
        <NSDatabase.IColumn>{
          type: ContextValue.COLUMN,
          label: row.column + ' ' + table,
          dataType: row.type,
          detail: `${row.type} (${row.mapping})`,
          isNullable: true,
          table: table,
          iconName: 'column',
          childType: ContextValue.NO_CHILD,
        }));
  }

  public async searchItems(itemType: ContextValue, search: string, _extraParams: any = {}): Promise<NSDatabase.SearchableItem[]> {
    switch (itemType) {
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        return this.searchTables(search);
      case ContextValue.COLUMN:
        const table = _extraParams.tables.length == 1 ? _extraParams.tables.label : "*";
        return this.searchColumns(search, table);
    }
    return [];
  }

  public getStaticCompletions: IConnectionDriver['getStaticCompletions'] = async () => {
    return {};
  }
}
