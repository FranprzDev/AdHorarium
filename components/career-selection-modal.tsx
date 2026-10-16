"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"

type Career = {
  id: number
  name: string
}

interface CareerSelectionModalProps {
  careers: Career[]
  currentCareerId: number | null
  onSelectCareer: (careerId: number) => void
  onClose: () => void
  isOpen: boolean
}

export function CareerSelectionModal({
  careers,
  currentCareerId,
  onSelectCareer,
  onClose,
  isOpen,
}: CareerSelectionModalProps) {
  const [selectedCareer, setSelectedCareer] = useState<string>(
    currentCareerId?.toString() ?? ""
  )

  const handleSave = () => {
    if (!selectedCareer) return
    onSelectCareer(Number.parseInt(selectedCareer))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">
            Seleccioná tu carrera
          </DialogTitle>
          <DialogDescription>
            Por favor, seleccioná la carrera que estás cursando para personalizar
            tu experiencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Select
            value={selectedCareer}
            onValueChange={setSelectedCareer}
          >
            <SelectTrigger aria-label="Carrera">
              <SelectValue placeholder="Seleccioná una carrera" />
            </SelectTrigger>
            <SelectContent>
              {careers.map((career) => (
                <SelectItem key={career.id} value={career.id.toString()}>
                  {career.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <motion.div
            className="flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleSave}
              disabled={!selectedCareer}
            >
              Guardar
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
