"use server";

import { headers } from "next/headers";
import {
  ApplicationSubmissionService,
  type SubmitResult,
} from "@/server/application/application-submission-service";

const submissionService = new ApplicationSubmissionService();

export async function submitApplication(
  formData: FormData,
): Promise<SubmitResult> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  return submissionService.execute(formData, ip);
}
