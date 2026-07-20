import { ref, onMounted, onUnmounted } from 'vue'

// Reactive clock that updates every second.
// Returns a ref<string> formatted as "YYYY-MM-DD HH:mm:ss".
export function useClock() {
  const now = ref(format(new Date()))
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = format(new Date())
    }, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { now }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function format(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
