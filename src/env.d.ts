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
