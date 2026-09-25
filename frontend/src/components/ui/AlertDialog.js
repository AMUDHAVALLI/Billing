import Modal from './Modal';
import Button from './Button';

export default function AlertDialog({ isOpen, title = 'Notice', message, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end">
        <Button onClick={onClose}>OK</Button>
      </div>
    </Modal>
  );
}
