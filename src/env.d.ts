/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'vue-barcode-reader' {
  import { DefineComponent } from 'vue'
  const BarcodeReader: DefineComponent<
    {
      formats?: string[]
      scanInterval?: number
      torch?: boolean
    },
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown
  >
  export default BarcodeReader
}
