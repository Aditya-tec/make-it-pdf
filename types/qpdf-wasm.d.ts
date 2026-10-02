declare module "qpdf-wasm" {
  interface QpdfModule {
    callMain: (args: string[]) => number;
    FS: {
      writeFile: (path: string, data: Uint8Array) => void;
      readFile: (path: string) => Uint8Array;
      unlink: (path: string) => void;
    };
    print: (msg: string) => void;
    printErr: (msg: string) => void;
  }
  function init(opts?: Partial<QpdfModule>): Promise<QpdfModule>;
  export default init;
}
