import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useUIStore } from '@/stores/ui'

export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const { toggleCommandPalette } = useUIStore()
  const sequenceRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return

      // Cmd+K / Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
        sequenceRef.current = ''
        clearTimeout(timerRef.current)
        return
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      // G+key navigation (vim-style goto shortcuts)
      if (sequenceRef.current === 'g') {
        clearTimeout(timerRef.current)
        sequenceRef.current = ''
        switch (key) {
          case 'h': navigate({ to: '/' });                      break
          case 'p': navigate({ to: '/sourcing' });              break
          case 'd': navigate({ to: '/sourcing/discover' });     break
          case 's': navigate({ to: '/sourcing/signals' });      break
          case 'q': navigate({ to: '/screening' });             break
          case 'm': navigate({ to: '/screening/memos' });       break
          case 'a': navigate({ to: '/agents' });                break
        }
        return
      }

      if (key === 'g') {
        sequenceRef.current = 'g'
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          sequenceRef.current = ''
        }, 1500)
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearTimeout(timerRef.current)
    }
  }, [navigate, toggleCommandPalette])
}
