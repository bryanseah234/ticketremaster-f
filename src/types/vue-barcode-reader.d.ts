declare module 'vue-barcode-reader' {
  import { DefineComponent } from 'vue'
  
  const StreamBarcodeReader: DefineComponent
  const ImageBarcodeReader: DefineComponent
  
  export { StreamBarcodeReader, ImageBarcodeReader }
  export default StreamBarcodeReader
}
