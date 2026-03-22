<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const toast = useToast()

type ScanResult = 'PASS' | 'FAILED' | 'WRONG_VENUE'

interface ScanRecord {
  id: number
  label: string
  result: ScanResult
  message: string
  time: string
}

const videoRef = ref<HTMLVideoElement | null>(null)
const cameraActive = ref(false)
const cameraError = ref('')
const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== 'undefined'

const feedback = ref<{ result: ScanResult; message: string } | null>(null)
const history = ref<ScanRecord[]>([])
let recordSeq = 0

const manualInput = ref('')
const manualLoading = ref(false)

let stream: MediaStream | null = null
let scanInterval: number | undefined
let detecting = false
let lastQr = ''
let lastQrTime = 0

const feedbackClass = computed(() => {
  if (!feedback.value) return ''
  return feedback.value.result === 'PASS' ? 'feedback-pass'
    : feedback.value.result === 'WRONG_VENUE' ? 'feedback-venue'
    : 'feedback-fail'
})

const feedbackLabel = computed(() => {
  if (!feedback.value) return ''
  return feedback.value.result === 'PASS' ? 'PASS'
    : feedback.value.result === 'WRONG_VENUE' ? 'WRONG VENUE'
    : 'FAILED'
})

const startCamera = async () => {
  cameraError.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
    cameraActive.value = true
    if (hasBarcodeDetector) startScanLoop()
  } catch {
    cameraError.value = 'Camera access denied. Use manual entry below.'
  }
}

const startScanLoop = () => {
  // @ts-ignore — BarcodeDetector is a modern browser API not yet in TS lib
  const detector = new BarcodeDetector({ formats: ['qr_code'] })
  scanInterval = window.setInterval(async () => {
    if (detecting || !videoRef.value || videoRef.value.readyState < 2) return
    detecting = true
    try {
      const codes = await detector.detect(videoRef.value)
      if (codes.length > 0) {
        const qr: string = codes[0].rawValue
        const now = Date.now()
        if (qr !== lastQr || now - lastQrTime > 4000) {
          lastQr = qr
          lastQrTime = now
          await processQr(qr)
        }
      }
    } catch {}
    detecting = false
  }, 400)
}

const processQr = async (qrHash: string) => {
  try {
    await api.post('/tickets/verify', { qr_hash: qrHash })
    showFeedback('PASS', 'Check-in successful', qrHash)
  } catch (e: any) {
    const code = e?.response?.data?.error_code
    if (code === 'WRONG_VENUE') {
      const venue = e?.response?.data?.correct_venue || 'another venue'
      showFeedback('WRONG_VENUE', `Redirect to: ${venue}`, qrHash)
    } else {
      const msg = e?.response?.data?.message
        || (code === 'QR_EXPIRED' ? 'QR expired'
          : code === 'TICKET_ALREADY_USED' ? 'Already scanned'
          : code === 'TICKET_NOT_FOUND' ? 'Ticket not found'
          : 'Verification failed')
      showFeedback('FAILED', msg, qrHash)
    }
  }
}

const showFeedback = (result: ScanResult, message: string, qrLabel: string) => {
  feedback.value = { result, message }
  history.value.unshift({
    id: recordSeq++,
    label: qrLabel.length > 28 ? qrLabel.slice(0, 28) + '…' : qrLabel,
    result,
    message,
    time: new Date().toLocaleTimeString(),
  })
  setTimeout(() => { feedback.value = null }, 3000)
}

const submitManual = async () => {
  const val = manualInput.value.trim()
  if (!val) return
  manualLoading.value = true
  try {
    await processQr(val)
    manualInput.value = ''
  } finally {
    manualLoading.value = false
  }
}

const clearHistory = () => { history.value = [] }

onMounted(startCamera)
onUnmounted(() => {
  if (scanInterval) clearInterval(scanInterval)
  stream?.getTracks().forEach(t => t.stop())
})
</script>

<template>
  <section class="page scanner-page">
    <div class="scanner-header">
      <span class="badge">Staff</span>
      <h1 class="section-title">QR Scanner</h1>
      <p class="small" style="opacity:.5">Point camera at a ticket QR code to check guests in.</p>
    </div>

    <div class="scanner-layout">
      <!-- Camera feed -->
      <article class="glass camera-card">
        <div class="camera-wrap">
          <video ref="videoRef" class="camera-feed" muted playsinline />

          <!-- Scan feedback overlay -->
          <div v-if="feedback" class="feedback-overlay" :class="feedbackClass">
            <p class="feedback-label">{{ feedbackLabel }}</p>
            <p class="feedback-msg">{{ feedback.message }}</p>
          </div>

          <!-- States when camera is loading / unavailable -->
          <div v-if="!cameraActive && !cameraError" class="camera-placeholder">
            <p class="small">Starting camera…</p>
          </div>
          <div v-if="cameraError" class="camera-placeholder state-error">
            <p class="small">{{ cameraError }}</p>
          </div>
          <div v-if="cameraActive && !hasBarcodeDetector" class="no-detector-notice">
            <p class="small">Auto-scan not supported in this browser — use Chrome or Edge. Manual entry is available below.</p>
          </div>
        </div>

        <!-- Manual entry fallback -->
        <div>
          <label>Manual entry</label>
          <div class="manual-row">
            <input
              v-model="manualInput"
              placeholder="Ticket ID or QR hash"
              @keydown.enter="submitManual"
            />
            <button :disabled="manualLoading || !manualInput.trim()" @click="submitManual">
              {{ manualLoading ? '…' : 'Verify' }}
            </button>
          </div>
        </div>
      </article>

      <!-- Session history -->
      <article class="glass history-card">
        <div class="history-head">
          <h2 class="section-title" style="font-size:1rem;margin:0">Session history</h2>
          <button v-if="history.length" class="btn-clear" @click="clearHistory">Clear</button>
        </div>

        <p v-if="history.length === 0" class="small" style="opacity:.45">No scans yet this session.</p>

        <ul v-else class="history-list">
          <li
            v-for="rec in history"
            :key="rec.id"
            class="history-item"
            :class="`hist-${rec.result.toLowerCase().replace('_', '-')}`"
          >
            <div class="hist-dot" />
            <div class="hist-info">
              <p class="hist-label">{{ rec.label }}</p>
              <p class="small hist-msg">{{ rec.message }}</p>
            </div>
            <span class="hist-time">{{ rec.time }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.scanner-page { max-width: 1040px; }
.scanner-header { margin-bottom: .75rem; }

.scanner-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 720px) {
  .scanner-layout { grid-template-columns: 1fr; }
}

/* Camera card */
.camera-card { padding: .85rem; display: grid; gap: .8rem; }

.camera-wrap {
  position: relative;
  border-radius: .5rem;
  overflow: hidden;
  background: #0b0b0d;
  aspect-ratio: 4/3;
}

.camera-feed { width: 100%; height: 100%; object-fit: cover; display: block; }

.camera-placeholder {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  color: rgba(255,255,255,.5);
}
.state-error { background: rgba(239,68,68,.12); color: #fca5a5; }

.no-detector-notice {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: .5rem .75rem;
  background: rgba(234,179,8,.18);
  color: #fef08a;
  text-align: center;
}

/* Feedback overlay */
.feedback-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: .35rem;
  animation: fadein .12s ease;
}
.feedback-pass  { background: rgba(34,197,94,.85); }
.feedback-fail  { background: rgba(239,68,68,.85); }
.feedback-venue { background: rgba(234,179,8,.85); }
.feedback-label {
  font-size: 2.6rem; font-weight: 800;
  letter-spacing: .06em; color: #fff; margin: 0;
  text-shadow: 0 2px 8px rgba(0,0,0,.3);
}
.feedback-msg { font-size: .9rem; color: rgba(255,255,255,.92); margin: 0; text-align: center; }

@keyframes fadein { from { opacity: 0 } to { opacity: 1 } }

/* Manual entry */
.manual-row { display: flex; gap: .5rem; margin-top: .3rem; }
.manual-row input { flex: 1; }
.manual-row button { white-space: nowrap; }

/* History */
.history-card {
  padding: .85rem;
  display: grid;
  gap: .6rem;
  align-content: start;
  max-height: 540px;
  overflow-y: auto;
}

.history-head { display: flex; align-items: center; justify-content: space-between; }

.btn-clear {
  font-size: .75rem;
  padding: .2rem .55rem;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: .35rem;
  cursor: pointer;
  color: inherit;
}
.btn-clear:hover { background: rgba(255,255,255,.12); }

.history-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }

.history-item {
  display: flex; align-items: center; gap: .55rem;
  padding: .4rem .55rem;
  border-radius: .4rem;
  background: rgba(255,255,255,.04);
}

.hist-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.hist-pass .hist-dot        { background: #22c55e; }
.hist-failed .hist-dot      { background: #ef4444; }
.hist-wrong-venue .hist-dot { background: #eab308; }

.hist-info { flex: 1; min-width: 0; }
.hist-label {
  font-size: .8rem; font-weight: 500; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hist-msg  { margin: 0; opacity: .55; }
.hist-time { font-size: .72rem; opacity: .4; flex-shrink: 0; }
</style>
