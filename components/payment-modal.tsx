"use client"

import { useState } from "react"
import { X, CreditCard, Check, Clock } from "lucide-react"
import { PAYMENT_PLANS, isPromoValid } from "@/lib/yoco-payment"
import { createYocoPayment } from "@/lib/yoco-payment"

interface PaymentModalProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ userId, onClose, onSuccess }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(PAYMENT_PLANS.SINGLE_ACCOUNT.id)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const promoActive = isPromoValid()

  const handleProceedToPayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Current URL for success/cancel redirects
      const currentUrl = window.location.href.split("?")[0] // Remove any existing query params
      const successUrl = `${currentUrl}?payment=success&plan=${selectedPlan}`
      const cancelUrl = `${currentUrl}?payment=cancelled`

      const result = await createYocoPayment(userId, selectedPlan, successUrl, cancelUrl)

      if (result.success && result.redirectUrl) {
        // Redirect to Yoco payment page
        window.location.href = result.redirectUrl
      } else {
        throw new Error(result.error || "Failed to create payment")
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-red-900 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-red-500">Upgrade Your Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            You've reached the limit of 1 free account. Choose a plan to add more trading accounts:
          </p>

          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border cursor-pointer ${
                selectedPlan === PAYMENT_PLANS.SINGLE_ACCOUNT.id
                  ? "border-red-500 bg-red-900/20"
                  : "border-gray-700 hover:border-red-500/50"
              }`}
              onClick={() => setSelectedPlan(PAYMENT_PLANS.SINGLE_ACCOUNT.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">{PAYMENT_PLANS.SINGLE_ACCOUNT.name}</h3>
                  <p className="text-sm text-gray-400">{PAYMENT_PLANS.SINGLE_ACCOUNT.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">R300</div>
                  <div className="text-xs text-gray-400">One-time payment</div>
                </div>
              </div>
              {selectedPlan === PAYMENT_PLANS.SINGLE_ACCOUNT.id && (
                <div className="mt-2 text-red-500 flex items-center">
                  <Check size={16} className="mr-1" /> Selected
                </div>
              )}
            </div>

            {promoActive ? (
              <div
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedPlan === PAYMENT_PLANS.PROMO_UNLIMITED.id
                    ? "border-red-500 bg-red-900/20"
                    : "border-gray-700 hover:border-red-500/50"
                }`}
                onClick={() => setSelectedPlan(PAYMENT_PLANS.PROMO_UNLIMITED.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-white">{PAYMENT_PLANS.PROMO_UNLIMITED.name}</h3>
                      <span className="ml-2 bg-yellow-600 text-yellow-100 text-xs px-2 py-0.5 rounded-full flex items-center">
                        <Clock size={12} className="mr-1" /> Limited Time
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{PAYMENT_PLANS.PROMO_UNLIMITED.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">R5,000</div>
                    <div className="text-xs text-gray-400">
                      <span className="line-through text-gray-500">R6,000</span> Special offer
                    </div>
                  </div>
                </div>
                {selectedPlan === PAYMENT_PLANS.PROMO_UNLIMITED.id && (
                  <div className="mt-2 text-red-500 flex items-center">
                    <Check size={16} className="mr-1" /> Selected
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedPlan === PAYMENT_PLANS.UNLIMITED_ACCOUNTS.id
                    ? "border-red-500 bg-red-900/20"
                    : "border-gray-700 hover:border-red-500/50"
                }`}
                onClick={() => setSelectedPlan(PAYMENT_PLANS.UNLIMITED_ACCOUNTS.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-white">{PAYMENT_PLANS.UNLIMITED_ACCOUNTS.name}</h3>
                    <p className="text-sm text-gray-400">{PAYMENT_PLANS.UNLIMITED_ACCOUNTS.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">R6,000</div>
                    <div className="text-xs text-gray-400">One-time payment</div>
                  </div>
                </div>
                {selectedPlan === PAYMENT_PLANS.UNLIMITED_ACCOUNTS.id && (
                  <div className="mt-2 text-red-500 flex items-center">
                    <Check size={16} className="mr-1" /> Selected
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <div className="mb-4 bg-red-900/30 text-red-500 p-3 rounded-md text-sm">{error}</div>}

        <button
          onClick={handleProceedToPayment}
          disabled={isProcessing}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={18} className="mr-2" />
              Proceed to Payment
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-center text-gray-400">
          Secure payment powered by Yoco. Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  )
}

