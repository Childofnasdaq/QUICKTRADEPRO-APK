"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaymentPlan, PRICING } from "@/lib/yoco-payment-client"
import { toast } from "@/hooks/use-toast"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (plan: PaymentPlan) => void
  userId: string
  currentPlan?: PaymentPlan
}

export default function PaymentModal({ isOpen, onClose, onSuccess, userId, currentPlan }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>(
    currentPlan === PaymentPlan.SINGLE_ACCOUNT ? PaymentPlan.TWO_ACCOUNTS : PaymentPlan.UNLIMITED,
  )
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      toast({
        title: "Missing information",
        description: "Please fill in all card details",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Process payment
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          plan: selectedPlan,
          cardDetails: {
            cardNumber,
            expiryMonth,
            expiryYear,
            cvv,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      if (data.success) {
        toast({
          title: "Payment successful",
          description: `Your account has been upgraded to ${selectedPlan.replace("_", " ")}`,
        })
        onSuccess(selectedPlan)
      } else {
        throw new Error(data.error || "Payment failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upgrade Your Account</DialogTitle>
          <DialogDescription>Choose a plan to connect more trading accounts</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Select Plan</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedPlan === PaymentPlan.TWO_ACCOUNTS ? "default" : "outline"}
                onClick={() => setSelectedPlan(PaymentPlan.TWO_ACCOUNTS)}
                className={selectedPlan === PaymentPlan.TWO_ACCOUNTS ? "bg-blue-500" : ""}
              >
                <div className="text-left">
                  <div className="font-bold">2 Accounts</div>
                  <div className="text-sm">R{PRICING[PaymentPlan.TWO_ACCOUNTS]}</div>
                </div>
              </Button>
              <Button
                variant={selectedPlan === PaymentPlan.UNLIMITED ? "default" : "outline"}
                onClick={() => setSelectedPlan(PaymentPlan.UNLIMITED)}
                className={selectedPlan === PaymentPlan.UNLIMITED ? "bg-blue-500" : ""}
              >
                <div className="text-left">
                  <div className="font-bold">Unlimited</div>
                  <div className="text-sm">R{PRICING[PaymentPlan.UNLIMITED]}</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                placeholder="MM"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                placeholder="YY"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing} className="bg-blue-500">
            {isProcessing ? "Processing..." : `Pay R${PRICING[selectedPlan]}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

