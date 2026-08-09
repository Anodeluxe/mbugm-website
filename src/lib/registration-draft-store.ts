import {
  DRAFT_ATTACHMENT_NAMES,
  type DraftAttachmentName,
  type DraftAttachments,
  type DraftMetadata,
  type RegistrationDraft,
  restoreRegistrationDraft,
  splitRegistrationDraft,
} from "./registration-draft";

const DB_NAME = "mbugm-registration-draft";
const STORE_NAME = "drafts";
const LEGACY_KEY = "daftar-v1";
const METADATA_KEY = "daftar-v2:metadata";
const ATTACHMENT_KEYS: Record<DraftAttachmentName, string> = {
  pasFoto: "daftar-v2:file:pasFoto",
  ktm: "daftar-v2:file:ktm",
  paymentProof: "daftar-v2:file:paymentProof",
};

export class RegistrationDraftStore<TValues> {
  async load(): Promise<RegistrationDraft<TValues> | null> {
    const db = await this.open();
    const stored = await new Promise<{
      metadata: DraftMetadata<TValues> | null;
      attachments: Partial<DraftAttachments>;
      legacy: RegistrationDraft<TValues> | null;
    }>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const metadata = store.get(METADATA_KEY);
      const legacy = store.get(LEGACY_KEY);
      const attachmentRequests = Object.fromEntries(
        DRAFT_ATTACHMENT_NAMES.map((name) => [
          name,
          store.get(ATTACHMENT_KEYS[name]),
        ]),
      ) as Record<DraftAttachmentName, IDBRequest<File | undefined>>;

      tx.oncomplete = () => {
        db.close();
        resolve({
          metadata:
            (metadata.result as DraftMetadata<TValues> | undefined) ?? null,
          attachments: Object.fromEntries(
            DRAFT_ATTACHMENT_NAMES.flatMap((name) => {
              const file = attachmentRequests[name].result;
              return file ? [[name, file]] : [];
            }),
          ) as Partial<DraftAttachments>,
          legacy:
            (legacy.result as RegistrationDraft<TValues> | undefined) ?? null,
        });
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });

    const draft = restoreRegistrationDraft(
      stored.metadata,
      stored.attachments,
      stored.legacy,
    );
    if (!draft || stored.metadata || !stored.legacy) return draft;

    try {
      await this.saveSnapshot(draft);
    } catch (error) {
      console.error("Draft migration failed:", error);
    }
    return draft;
  }

  saveMetadata(metadata: DraftMetadata<TValues>) {
    return this.update((store) => {
      store.put(metadata, METADATA_KEY);
    });
  }

  saveAttachment(name: DraftAttachmentName, file: File | null) {
    return this.update((store) => {
      if (file) store.put(file, ATTACHMENT_KEYS[name]);
      else store.delete(ATTACHMENT_KEYS[name]);
    });
  }

  clear() {
    return this.update((store) => {
      store.delete(LEGACY_KEY);
      store.delete(METADATA_KEY);
      for (const name of DRAFT_ATTACHMENT_NAMES) {
        store.delete(ATTACHMENT_KEYS[name]);
      }
    });
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async update(update: (store: IDBObjectStore) => void) {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      update(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  private saveSnapshot(draft: RegistrationDraft<TValues>) {
    const { metadata, attachments } = splitRegistrationDraft(draft);
    return this.update((store) => {
      store.put(metadata, METADATA_KEY);
      for (const name of DRAFT_ATTACHMENT_NAMES) {
        const file = attachments[name];
        if (file) store.put(file, ATTACHMENT_KEYS[name]);
        else store.delete(ATTACHMENT_KEYS[name]);
      }
      store.delete(LEGACY_KEY);
    });
  }
}
