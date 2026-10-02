---
title: "How to Password-Protect a PDF Free — AES-256 Encryption in Your Browser"
excerpt: "Add a strong password to your PDF using AES-256 encryption, entirely in your browser. Your password is never sent to any server."
relatedTools: ["encrypt-pdf", "organize-pages", "add-watermark"]
---

## Why password-protect a PDF?

Password-protected PDFs require the password to open. This protects:

- Confidential contracts before sharing by email
- Financial statements sent to accountants
- Medical records or personal identification documents
- Any file you want to ensure only the recipient can read

## What is AES-256 encryption?

AES-256 (Advanced Encryption Standard with a 256-bit key) is a widely used, standardised cipher for protecting sensitive data. A correctly encrypted PDF cannot be read without the password — even if someone intercepts the file.

## How to password-protect a PDF free

1. Open the **Encrypt PDF** tool.
2. Drop your PDF onto the upload zone.
3. Enter your password in the **Password** field.
4. Re-enter it in **Confirm password** to avoid typos.
5. Click **Encrypt PDF**.
6. Download the protected PDF.

The output file will require the password to open in any PDF reader (Adobe Acrobat, Chrome, iOS Files, etc.).

## Important: store your password safely

If you forget the password, the file cannot be recovered. Write the password down somewhere safe, or use a password manager like Bitwarden (free) or 1Password.

## Is my password sent to a server?

No. The encryption runs entirely in your browser using a WebAssembly build of qpdf, a widely-used open-source PDF tool. Your password and your file never leave your device.

## What if I want to remove the password later?

Open the PDF in your browser (Chrome, Firefox, Edge), enter the password, and use **File → Print → Save as PDF** without a password set. This removes the password protection.
