'use client'

/**
 * SessionManagementMenu Component
 * Menu com opções de gerenciamento durante uma sessão de foco
 */

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Input } from '@/app/components/ui/input'
import { 
  MoreVertical, 
  Pause, 
  FileText, 
  Trash2, 
  Plus,
  AlertTriangle 
} from 'lucide-react'

interface SessionManagementMenuProps {
  sessionId: string
  currentNote?: string | null
  onPause: () => void
  onAddNote: (note: string) => void
  onDelete: () => void
  onExtendTime: (minutes: number) => void
}

export function SessionManagementMenu({
  sessionId,
  currentNote,
  onPause,
  onAddNote,
  onDelete,
  onExtendTime,
}: SessionManagementMenuProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [note, setNote] = useState(currentNote || '')
  const [extendMinutes, setExtendMinutes] = useState(5)

  const handleSaveNote = () => {
    onAddNote(note)
    setShowNoteDialog(false)
  }

  const handleExtend = () => {
    if (extendMinutes > 0) {
      onExtendTime(extendMinutes)
      setShowExtendDialog(false)
      setExtendMinutes(5)
    }
  }

  const handleDelete = () => {
    onDelete()
    setShowDeleteDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onPause}>
            <Pause className="mr-2 h-4 w-4" />
            Pausar/Interromper
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNoteDialog(true)}>
            <FileText className="mr-2 h-4 w-4" />
            {currentNote ? 'Editar Nota' : 'Adicionar Nota'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowExtendDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Estender Tempo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar Sessão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Nota */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentNote ? 'Editar Nota' : 'Adicionar Nota'}
            </DialogTitle>
            <DialogDescription>
              Adicione observações sobre esta sessão de foco
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Textarea
                id="note"
                placeholder="Ex: Consegui terminar o primeiro capítulo..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote}>
              Salvar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Estender Tempo */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Estender Tempo</DialogTitle>
            <DialogDescription>
              Adicione mais minutos à sessão atual
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="extend-minutes">Minutos adicionais</Label>
              <Input
                id="extend-minutes"
                type="number"
                min="1"
                max="60"
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 25].map((min) => (
                <Button
                  key={min}
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendMinutes(min)}
                >
                  +{min}min
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtend}>
              Estender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Deletar Sessão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar esta sessão? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

