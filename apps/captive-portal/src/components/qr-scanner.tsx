import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, AlertCircle, X } from 'lucide-react'

export function QRScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const containerId = 'qr-reader'
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(containerId)
    html5QrcodeRef.current = html5Qrcode

    html5Qrcode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText)
          if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
            html5QrcodeRef.current.stop().catch(() => {})
          }
        },
        () => {},
      )
      .catch((err) => {
        console.warn('Câmera não permitida ou indisponível', err)
        setCameraError('Permita o acesso à câmera para ler o QR Code ou digite o código abaixo.')
      })

    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(() => {})
      }
    }
  }, [onScan])

  return (
    <div className="relative rounded-2xl border border-hairline bg-surface p-4 text-center shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-ink">
          <Camera size={16} className="text-primary animate-pulse" />
          <span>Aponte a câmera para o QR Code</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-ink-muted hover:bg-surface-soft hover:text-ink transition-colors"
          title="Fechar câmera"
        >
          <X size={16} />
        </button>
      </div>

      {cameraError ? (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-error-soft border border-error/15 text-center space-y-2">
          <AlertCircle size={24} className="text-error" />
          <p className="text-xs text-error leading-relaxed">{cameraError}</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-black min-h-[220px]">
          <div id={containerId} className="w-full h-full" />
        </div>
      )}
    </div>
  )
}
