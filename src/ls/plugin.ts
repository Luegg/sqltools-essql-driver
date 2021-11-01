import { ILanguageServerPlugin } from '@sqltools/types';
import { DRIVER_ALIASES } from './../constants';
import YourDriver from './driver';

const EsSqlDriverPlugin: ILanguageServerPlugin = {
  register(server) {
    DRIVER_ALIASES.forEach(({ value }) => {
      server.getContext().drivers.set(value, YourDriver as any);
    });
  }
}

export default EsSqlDriverPlugin;
