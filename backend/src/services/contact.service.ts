import { ContactMessageModel } from "../models/contactMessage.model";
import type { ContactMessageInput } from "../validators/contact.validator";

export const ContactService = {
  async submit(input: ContactMessageInput) {
    const record = await ContactMessageModel.create(input);
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone,
      subject: record.subject,
      message: record.message,
      createdAt: record.created_at
    };
  }
};
