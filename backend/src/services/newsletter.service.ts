import { NewsletterModel } from "../models/newsletter.model";

export const NewsletterService = {
  async subscribe(email: string) {
    const { record, alreadySubscribed } = await NewsletterModel.subscribe(email);
    return { email: record.email, alreadySubscribed };
  }
};
