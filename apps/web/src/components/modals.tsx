import { useState } from "react"
import { createCallable } from "react-call"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"

interface ConfirmProps {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

/** `await Confirm.call({...})` -> boolean. Rendered once via <Confirm.Root />. */
export const Confirm = createCallable<ConfirmProps, boolean>(
  ({ call, title, description, confirmLabel = "Confirmar", destructive }) => (
    <AlertDialog open onOpenChange={(open) => !open && call.end(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => call.end(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : undefined}
            onClick={() => call.end(true)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
)

interface PromptProps {
  title: string
  label?: string
  defaultValue?: string
  submitLabel?: string
}

/** Text prompt modal: resolves with the value, or null when cancelled. */
export const Prompt = createCallable<PromptProps, string | null>(
  ({ call, title, defaultValue = "", submitLabel = "Guardar" }) => {
    const [value, setValue] = useState(defaultValue)
    const submit = () => {
      const trimmed = value.trim()
      if (trimmed) call.end(trimmed)
    }
    return (
      <Dialog open onOpenChange={(open) => !open && call.end(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => call.end(null)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!value.trim()}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
)
