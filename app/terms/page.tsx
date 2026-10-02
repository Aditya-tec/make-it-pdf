import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the free in-browser PDF tools.",
};

export default function Terms() {
  return (
    <article className="prose paper max-w-3xl mx-4 sm:mx-8 my-12 sm:my-16 p-6 sm:p-10">
      <h1>Terms of Use</h1>
      <p><em>Last updated: October 2026</em></p>

      <h2>Use of the service</h2>
      <p>
        These tools are free to use for personal and commercial purposes. You are responsible for having the
        right to process the files you use and for what you do with the results.
      </p>

      <h2>No warranty</h2>
      <p>
        The tools are provided &ldquo;as is&rdquo;, without warranties of any kind. Output (including
        converted, compressed or encrypted files) may differ from what you expect, for example, Word
        to PDF conversion is not pixel-perfect. Keep a copy of your original files and check results
        before relying on them.
      </p>

      <h2>Passwords and encryption</h2>
      <p>
        We cannot recover forgotten passwords or decrypt files you have encrypted with the Encrypt PDF tool.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we are not liable for any loss or damage arising from use of
        the site, including loss of data.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; continued use means you accept the updated terms.</p>
    </article>
  );
}
