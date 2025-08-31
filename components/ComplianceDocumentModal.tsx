import React, { useState } from 'react';
import { ComplianceTask, ComplianceDocument } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface ComplianceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ComplianceTask;
  onAddDocument: (taskId: string, documentName: string) => void;
  onDeleteDocument: (taskId: string, documentId: string) => void;
}

const ComplianceDocumentModal: React.FC<ComplianceDocumentModalProps> = ({ isOpen, onClose, task, onAddDocument, onDeleteDocument }) => {
  const [newDocumentName, setNewDocumentName] = useState('');

  const handleAddClick = () => {
    // In a real app, you would handle the file upload here.
    // For this demo, we'll just use the file name.
    if (newDocumentName.trim()) {
      onAddDocument(task.id, newDocumentName);
      setNewDocumentName('');
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Documentos de: ${task.name}`}>
      <div className="p-6">
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
          {(task.documents && task.documents.length > 0) ? (
            task.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-pf-beige/50 rounded-lg">
                <div className="flex items-center">
                   <i className="fas fa-file-alt text-pf-green mr-3"></i>
                   <div>
                    <p className="font-semibold text-pf-brown">{doc.name}</p>
                    <p className="text-xs text-pf-brown/70">Subido: {new Date(doc.uploadedAt).toLocaleString()}</p>
                   </div>
                </div>
                <div className="space-x-3">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-pf-blue hover:text-pf-blue/70 p-2"><i className="fas fa-eye"></i></a>
                    <button onClick={() => onDeleteDocument(task.id, doc.id)} className="text-red-500 hover:text-red-700 p-2">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No hay documentos adjuntos para esta tarea.</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-pf-beige">
          <h3 className="font-semibold mb-2">Adjuntar Nuevo Documento</h3>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              onChange={(e) => setNewDocumentName(e.target.files ? e.target.files[0].name : '')}
              className="block w-full text-sm text-pf-brown/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pf-gold/20 file:text-pf-brown hover:file:bg-pf-gold/40"
            />
            <Button onClick={handleAddClick} disabled={!newDocumentName} className="py-2 px-4">
              <i className="fas fa-upload"></i>
            </Button>
          </div>
           <p className="text-xs text-pf-brown/60 mt-2">Nota: Esto es una simulación. No se subirán archivos reales.</p>
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ComplianceDocumentModal;