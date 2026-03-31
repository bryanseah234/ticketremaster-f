<script setup lang="ts">
import { ref, computed } from 'vue'
import { StreamBarcodeReader } from 'vue-barcode-reader'
import api from '@/api/client'

// Type workaround for vue-barcode-reader
const BarcodeReader = StreamBarcodeReader

type ScanResult = 'PASS' | 'FAILED' | 'WRONG_VENUE'

interface ScanRecord {
  id: number
  label: string
  sublabel: string
  result: ScanResult
  message: string
  time: string
}

const feedback = ref<{ result: ScanResult; message: string } | null>(null)
const history = ref<ScanRecord[]>([])
let recordSeq = 0

const manualInput = ref('')
const manualLoading = ref(false)

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

const processQr = async (raw: string) => {
  const qrHash = raw.includes('/ticket-qr/') ? raw.split('/ticket-qr/')[1].split('?')[0] : raw
  try {
    const { data } = await api.post('/verify/scan', { qrHash })
    const d = data?.data
    const label = d?.event?.name || 'Unknown Event'
    const sublabel = d?.ticketId ? `Ticket ${d.ticketId.slice(0, 8)}…` : qrHash.slice(0, 16) + '…'
    showFeedback('PASS', 'Check-in successful', label, sublabel)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    if (code === 'WRONG_HALL') {
      const venue = e?.response?.data?.error?.correctVenue?.name || 'another venue'
      showFeedback('WRONG_VENUE', `Redirect to: ${venue}`, qrHash.slice(0, 16) + '…', '')
    } else {
      const msg = e?.response?.data?.error?.message
        || (code === 'QR_EXPIRED' ? 'QR expired'
          : code === 'ALREADY_CHECKED_IN' ? 'Already scanned'
          : code === 'TICKET_NOT_FOUND' ? 'Ticket not found'
          : 'Verification failed')
      showFeedback('FAILED', msg, qrHash.slice(0, 16) + '…', '')
    }
  }
}

const onDecode = (result: string) => {
  if (!result) return
  const now = Date.now()
  if (result === lastQr && now - lastQrTime < 4000) return
  lastQr = result
  lastQrTime = now
  processQr(result)
}

const showFeedback = (result: ScanResult, message: string, label: string, sublabel = '') => {
  feedback.value = { result, message }
  history.value.unshift({
    id: recordSeq++,
    label: label.length > 28 ? label.slice(0, 28) + '…' : label,
    sublabel,
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
    const { data } = await api.post('/verify/manual', { ticketId: val })
    const d = data?.data
    const label = d?.event?.name || 'Manual entry'
    const sublabel = `Ticket ${val.slice(0, 8)}…`
    showFeedback('PASS', 'Check-in successful', label, sublabel)
    manualInput.value = ''
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    const msg = e?.response?.data?.error?.message
      || (code === 'ALREADY_CHECKED_IN' ? 'Already scanned'
        : code === 'TICKET_NOT_FOUND' ? 'Ticket not found'
        : code === 'QR_INVALID' ? 'Ticket not valid for entry'
        : 'Verification failed')
    showFeedback('FAILED', msg, `Ticket ${val.slice(0, 8)}…`)
  } finally {
    manualLoading.value = false
  }
}

const clearHistory = () => { history.value = [] }
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
          <component :is="BarcodeReader" @decode="onDecode" />

          <!-- Scan feedback overlay -->
          <div v-if="feedback" class="feedback-overlay" :class="feedbackClass">
            <p class="feedback-label">{{ feedbackLabel }}</p>
            <p class="feedback-msg">{{ feedback.message }}</p>
          </div>
        </div>

        <!-- Manual entry fallback -->
        <div>
          <label>Manual entry</label>
          <div class="manual-row">
            <input
              v-model="manualInput"
              placeholder="Ticket ID"
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
              <p v-if="rec.sublabel" class="small hist-sublabel">{{ rec.sublabel }}</p>
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
}

/* Feedback overlay */
.feedback-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: .35rem;
  animation: fadein .12s ease;
  pointer-events: none;
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
.hist-sublabel { margin: 0; opacity: .65; font-size: .72rem; }
.hist-msg  { margin: 0; opacity: .55; }
.hist-time { font-size: .72rem; opacity: .4; flex-shrink: 0; }
</style>
