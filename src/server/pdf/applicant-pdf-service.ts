import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { downloadFile } from "@/server/google/drive";
import { toDataUri } from "@/server/images";
import { renderApplicantPdf } from "@/server/pdf/render";

export class ApplicantPdfService {
  constructor(private readonly applicantId: string) {}

  async execute() {
    const applicant = await db.query.applicants.findFirst({
      where: eq(applicants.id, this.applicantId),
    });
    if (!applicant) return null;

    const [pasFoto, ktm, paymentProof] = await Promise.all([
      this.downloadImage(applicant.pasFotoDriveId, "pas foto"),
      this.downloadImage(applicant.fotoKtmDriveId, "KTM"),
      this.downloadImage(applicant.paymentProofDriveId, "bukti pembayaran"),
    ]);
    const bytes = await renderApplicantPdf(applicant, {
      pasFoto,
      ktm,
      paymentProof,
    });

    return { bytes, referenceNumber: applicant.referenceNumber };
  }

  private async downloadImage(fileId: string | null, label: string) {
    if (!fileId) return undefined;

    try {
      return toDataUri(await downloadFile(fileId));
    } catch (error) {
      console.error(`Could not load ${label} for PDF preview:`, error);
      return undefined;
    }
  }
}
