declare module 'virtual:shared-ui-manifest' {
  export interface SharedUiExport {
    name: string;
    isComponent: boolean;
  }
  export const sharedUiExports: SharedUiExport[];
}
