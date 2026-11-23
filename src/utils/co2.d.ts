declare module '@tgwf/co2' {
  export class co2 {
    constructor(options?: { model?: 'swd' | '1byte'; version?: 3 | 4 });
    perByte(bytes: number, green?: boolean): number | Record<string, number>;
  }
}
