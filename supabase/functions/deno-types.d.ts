declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
}

declare module "https://*" {
  export const serve: any;
  const content: any;
  export default content;
}
