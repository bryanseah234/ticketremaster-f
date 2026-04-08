import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponseHeaders } from 'axios'

const toastPush = vi.fn()
const clearSession = vi.fn()
const consoleError = vi.fn()

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    state: {
      accessToken: 'test-token',
      user: null,
    },
    clearSession,
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    push: toastPush,
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/services/mockData', () => ({
  setDemoMode: vi.fn(),
  isDemoMode: vi.fn(() => false),
}))

const { default: api } = await import('@/api/client')

function createTransferNotFoundError(config: InternalAxiosRequestConfig) {
  return new AxiosError(
    'Request failed with status code 404',
    'ERR_BAD_REQUEST',
    config,
    {},
    {
      status: 404,
      statusText: 'Not Found',
      config,
      headers: {} as AxiosResponseHeaders,
      data: {
        error: {
          code: 'TRANSFER_NOT_FOUND',
          message: 'Transfer not found.',
        },
      },
    },
  )
}

describe('api client silent background requests', () => {
  beforeEach(() => {
    toastPush.mockReset()
    clearSession.mockReset()
    consoleError.mockReset()
    vi.spyOn(console, 'error').mockImplementation(consoleError)
    api.defaults.adapter = async (config) => {
      throw createTransferNotFoundError(config)
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('suppresses toast for silent background polling requests', async () => {
    await expect(api.get('/transfer/my-pending', { suppressErrorToast: true } as any)).rejects.toBeInstanceOf(AxiosError)

    expect(toastPush).not.toHaveBeenCalled()
  })

  it('keeps toast behavior for normal requests', async () => {
    await expect(api.get('/transfer/my-pending')).rejects.toBeInstanceOf(AxiosError)

    expect(toastPush).toHaveBeenCalledWith('Transfer not found.', 'error')
    expect(consoleError).toHaveBeenCalled()
  })

  it('suppresses console logging for silent background polling requests', async () => {
    await expect(
      api.get('/purchase/hold/resume/evt_001', { suppressErrorToast: true, suppressErrorLog: true } as any),
    ).rejects.toBeInstanceOf(AxiosError)

    expect(consoleError).not.toHaveBeenCalled()
  })
})
