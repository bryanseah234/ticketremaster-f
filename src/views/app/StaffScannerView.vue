<script setup lang="ts">
import { computed, markRaw, onMounted, ref, shallowRef } from 'vue'
import api from '@/api/client'
import { isDemoMode } from '@/services/mockData'

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
const manualInput = ref('')
const manualLoading = ref(false)
const cameraSupported = ref(false)
const barcodeReader = shallowRef<any>(null)
let recordSeq = 0
let lastQr = ''
let lastQrTime = 0

const feedbackClass = computed(() => {
  if (!feedback.value) return ''
  return feedback.value.result === 'PASS' ? 'feedback-pass' : feedback.value.result === 'WRONG_VENUE' ? 'feedback-venue' : 'feedback-fail'
})

const feedbackLabel = computed(() => {
  if (!feedback.value) return ''
  return feedback.value.result === 'PASS' ? 'PASS' : feedback.value.result === 'WRONG_VENUE' ? 'WRONG VENUE' : 'FAILED'
})

const showFeedback = (result: ScanResult, message: string, label: string, sublabel = '') => {
  feedback.value = { result, message }
  history.value.unshift({
    id: recordSeq++,
    label: label.length > 28 ? `${label.slice(0, 28)}...` : label,
    sublabel,
    result,
    message,
    time: new Date().toLocaleTimeString(),
  })
  setTimeout(() => {
    feedback.value = null
  }, 3000)
}

const processQr = async (raw: string) => {
  const qrHash = raw.includes('/ticket-qr/') ? raw.split('/ticket-qr/')[1].split('?')[0] : raw
  try {
    if (isDemoMode()) {
      showFeedback('PASS', 'Check-in successful', 'Afterlight: Echoes of Eternity', `Ticket ${qrHash.slice(0, 8)}...`)
      return
    }
    const { data } = await api.post('/verify/scan', { qrHash })
    const d = data?.data
    const label = d?.event?.name || 'Unknown Event'
    const sublabel = d?.ticketId ? `Ticket ${d.ticketId.slice(0, 8)}...` : `${qrHash.slice(0, 16)}...`
    showFeedback('PASS', 'Check-in successful', label, sublabel)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    if (code === 'WRONG_HALL') {
      const venue = e?.response?.data?.error?.correctVenue?.name || 'another venue'
      showFeedback('WRONG_VENUE', `Redirect to: ${venue}`, `${qrHash.slice(0, 16)}...`)
    } else {
      const message = e?.response?.data?.error?.message
        || (code === 'QR_EXPIRED' ? 'QR expired'
          : code === 'ALREADY_CHECKED_IN' ? 'Already scanned'
          : code === 'TICKET_NOT_FOUND' ? 'Ticket not found'
          : 'Verification failed')
      showFeedback('FAILED', message, `${qrHash.slice(0, 16)}...`)
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

const submitManual = async () => {
  const value = manualInput.value.trim()
  if (!value) return
  manualLoading.value = true
  try {
    if (isDemoMode()) {
      showFeedback('PASS', 'Check-in successful', 'Manual entry', `Ticket ${value.slice(0, 8)}...`)
      manualInput.value = ''
      return
    }
    const { data } = await api.post('/verify/manual', { ticketId: value })
    const d = data?.data
    const label = d?.event?.name || 'Manual entry'
    showFeedback('PASS', 'Check-in successful', label, `Ticket ${value.slice(0, 8)}...`)
    manualInput.value = ''
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    const message = e?.response?.data?.error?.message
      || (code === 'ALREADY_CHECKED_IN' ? 'Already scanned'
        : code === 'TICKET_NOT_FOUND' ? 'Ticket not found'
        : 'Verification failed')
    showFeedback('FAILED', message, `Ticket ${value.slice(0, 8)}...`)
  } finally {
    manualLoading.value = false
  }
}

onMounted(() => {
  cameraSupported.value = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  if (cameraSupported.value) {
    import('vue-barcode-reader')
      .then((module) => {
        barcodeReader.value = markRaw(module.StreamBarcodeReader)
      })
      .catch(() => {
        cameraSupported.value = false
      })
  }
})
</script>

<template>
  <section class="page scanner-page">
    <div class="scanner-top">
      <div>
        <span class="badge">Staff Scanner</span>
        <h1 class="section-title">Fast gate verification for live events.</h1>
        <p class="section-subtitle">Scan QR codes or verify tickets manually when the line is moving quickly.</p>
      </div>
    </div>

    <div class="scanner-grid">
      <article class="glass scanner-card">
        <div class="camera-wrap">
          <component v-if="cameraSupported && barcodeReader" :is="barcodeReader" @decode="onDecode" />
          <div v-else class="camera-fallback">
            <span class="badge">Camera unavailable</span>
            <h2>Use manual verification on this device.</h2>
            <p class="small muted">Live scanning is only enabled when the browser supports camera access.</p>
          </div>
          <div v-if="feedback" class="feedback-overlay" :class="feedbackClass">
            <p class="feedback-label">{{ feedbackLabel }}</p>
            <p class="feedback-msg">{{ feedback.message }}</p>
          </div>
        </div>

        <div class="manual-card panel">
          <label>Manual ticket lookup</label>
          <div class="manual-row">
            <input v-model="manualInput" placeholder="Ticket ID" @keydown.enter="submitManual" />
            <button :disabled="manualLoading || !manualInput.trim()" @click="submitManual">{{ manualLoading ? '...' : 'Verify' }}</button>
          </div>
        </div>
      </article>

      <article class="glass history-card">
        <div class="history-head">
          <span class="badge">Session History</span>
          <p class="small muted">{{ history.length }} check{{ history.length === 1 ? '' : 's' }}</p>
        </div>
        <p v-if="history.length === 0" class="small muted">No scans yet this session.</p>
        <ul v-else class="history-list">
          <li v-for="record in history" :key="record.id" class="history-item" :class="`hist-${record.result.toLowerCase().replace('_', '-')}`">
            <div class="hist-dot"></div>
            <div class="hist-copy">
              <strong>{{ record.label }}</strong>
              <p v-if="record.sublabel" class="small muted">{{ record.sublabel }}</p>
              <p class="small muted">{{ record.message }}</p>
            </div>
            <span class="hist-time">{{ record.time }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.scanner-page { display: grid; gap: 1rem; }
.scanner-grid { display: grid; grid-template-columns: 1.4fr 0.9fr; gap: 1rem; }
.scanner-card, .history-card { padding: 1rem; display: grid; gap: 1rem; }
.camera-wrap {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  min-height: 420px;
  background: #0b0b0d;
}
.camera-fallback {
  height: 100%;
  min-height: 420px;
  display: grid;
  place-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}
.camera-fallback h2,
.camera-fallback p {
  margin: 0;
}
.manual-card { padding: 1rem; }
.manual-row { display: flex; gap: 0.65rem; flex-wrap: wrap; }
.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.history-list {
  display: grid;
  gap: 0.65rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.history-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.85rem;
  border-radius: var(--radius-md);
  background: rgba(60,51,49,.45);
}
.hist-dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; margin-top: 0.25rem; }
.hist-pass .hist-dot { background: var(--success); }
.hist-failed .hist-dot { background: var(--error); }
.hist-wrong-venue .hist-dot { background: var(--warning); }
.hist-copy { flex: 1; display: grid; gap: 0.2rem; }
.hist-time { color: var(--textMuted); font-size: 0.75rem; }
.feedback-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 0.25rem;
}
.feedback-pass { background: rgba(82,209,140,.88); }
.feedback-fail { background: rgba(255,140,122,.88); }
.feedback-venue { background: rgba(255,176,32,.88); }
.feedback-label { font-size: 2.75rem; font-weight: 800; color: #fff; letter-spacing: 0.08em; }
.feedback-msg { color: rgba(255,255,255,.95); }
@media (max-width: 920px) {
  .scanner-grid { grid-template-columns: 1fr; }
}
</style>
