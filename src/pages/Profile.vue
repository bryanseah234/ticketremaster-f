<template>
  <div class="profile-page">
    <!-- Header -->
    <section class="profile-header py-5 bg-light text-center">
      <div class="container-lg">
        <h2 class="section-title">My Profile</h2>
      </div>
    </section>

    <!-- Profile Info -->
    <section class="profile-info py-5">
      <div class="container-lg">
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading profile...</p>
        </div>

        <div v-else>
          <div class="card profile-card mx-auto" style="max-width: 600px;">
            <div class="row g-0">
              <div class="col-md-4 text-center bg-primary text-white d-flex flex-column justify-content-center align-items-center py-4">
                <div class="avatar">👤</div>
                <h5 class="mt-2 mb-0">{{ profile.name || 'User' }}</h5>
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">{{ profile.email || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Phone:</span>
                    <span class="value">{{ profile.phone || '-' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Credits:</span>
                    <span class="value">${{ balance.toFixed(2) }}</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" @click="loadBalance">
                      Top up
                    </button>
                  </div>
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <span :class="['value', profile.flagged ? 'text-danger' : 'text-success']">
                      {{ profile.flagged ? 'Flagged' : 'Good standing' }}
                    </span>
                  </div>
                  <div class="mt-3 text-end">
                    <button class="btn btn-sm btn-secondary">
                      Edit profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const KONG_GATEWAY = 'http://localhost:8000'
const profile = ref({})
const balance = ref(0)
const isLoading = ref(false)

const loadProfile = async () => {
  isLoading.value = true
  try {
    const resp = await axios.get(`${KONG_GATEWAY}/api/profile`)
    profile.value = resp.data.data || {}
  } catch (err) {
    console.error('Failed to load profile:', err)
    profile.value = {}
  } finally {
    isLoading.value = false
  }
}

const loadBalance = async () => {
  try {
    const resp = await axios.get(`${KONG_GATEWAY}/api/credits/balance`)
    balance.value = resp.data.data?.credit_balance || 0
  } catch (err) {
    console.error('Failed to load balance:', err)
    balance.value = 0
  }
}

onMounted(() => {
  loadProfile()
  loadBalance()
})
</script>

<style scoped>
.profile-page {
  background: #fff;
}

.profile-card {
  border: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.avatar {
  font-size: 60px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-row .label {
  width: 100px;
  font-weight: 600;
}

.info-row .value {
  flex: 1;
}
</style>
