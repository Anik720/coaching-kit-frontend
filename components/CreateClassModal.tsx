"use client";

import { useForm } from "react-hook-form";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Input } from "@headlessui/react";


interface CreateClassModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateClassModal({
  open,
  onClose,
  onCreate,
}: CreateClassModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const submitForm = (data: any) => {
    onCreate(data.className);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Class"
    >
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
        <Input
          label="Class Name *"
          {...register("className", { 
            required: "Class name is required",
            minLength: {
              value: 2,
              message: "Class name must be at least 2 characters"
            }
          })}
          placeholder="Enter class name"
          error={errors.className?.message as string}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Class
          </Button>
        </div>
      </form>
    </Modal>
  );
}