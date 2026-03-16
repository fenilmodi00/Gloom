import { z } from 'zod';

export const LoginSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
});

export const OnboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  stylePreferences: z.array(z.string()).min(1, 'Select at least one style'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type OnboardingFormData = z.infer<typeof OnboardingSchema>;
