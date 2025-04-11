import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Category } from './CategorySelector';
import { ScanType } from '../services/api';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  passportId: string;
  scanType: ScanType;
  categories: Category[];
  missingRequirement?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  passportId,
  scanType,
  categories,
  missingRequirement,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Confirm Passport Processing
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Passport ID</p>
                    <p className="mt-1 text-sm text-gray-900">{passportId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Scan Type</p>
                    <p className="mt-1 text-sm text-gray-900">{scanType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {category.name} ({category.type})
                        </span>
                      ))}
                    </div>
                  </div>
                  {missingRequirement && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Missing Requirement
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {missingRequirement}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onConfirm}
                  >
                    Confirm
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmationDialog; 