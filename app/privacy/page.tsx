import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "OfflinePDF processes files entirely in your browser; tested with zero third-party network requests during file processing. Nothing is uploaded.",
};

export default function Privacy() {
  return (
    <article className="prose paper max-w-3xl mx-4 sm:mx-8 my-12 sm:my-16 p-6 sm:p-10">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: October 2026</em></p>

      <h2>Your files</h2>
      <p>
        Every tool on this site runs inside your browser. The files you choose are read into your
        device&apos;s memory, processed there (WebAssembly and Web Workers), and handed back to you as a
        download. They are not uploaded to, stored on, or seen by any server we operate. File processing
        has been tested with zero third-party network requests during that work. Closing or reloading
        the tab discards them.
      </p>

      <h2>Exceptions: P2P Share and Whiteboard</h2>
      <p>
        These two tools connect two browsers directly, so they do use the network. Your browser contacts
        the free public PeerJS signaling service (0.peerjs.com) and Google&apos;s public STUN servers
        (stun.l.google.com), which can see IP addresses and a random room ID. Files and drawings travel
        directly between the browsers and are not stored by us or by those services. The connection
        requests are only made on those two pages, and only after you start or join a session.
      </p>

      <h2>Camera</h2>
      <p>
        Scan to PDF asks for camera access, only on its own page. Frames stay in the tab and are never uploaded.
      </p>

      <h2>What we collect</h2>
      <p>
        We do not require an account and do not ask for personal information. We do not use advertising or
        tracking cookies. Like any web host, our hosting provider (Vercel) may keep standard server logs
        (such as IP address and requested page) for operating and securing the service.
      </p>

      <h2>Passwords</h2>
      <p>
        A password you enter in the Encrypt PDF tool is used only in your browser to encrypt your file.
        It is never transmitted. We cannot recover it, if you lose it, the file cannot be opened.
      </p>

      <h2>Third parties</h2>
      <p>
        The site loads no third-party scripts, fonts, or analytics. Fonts are self-hosted at build time.
        Links to other sites are governed by those sites&apos; own policies.
      </p>

      <h2>Accounts and paywalls</h2>
      <p>
        OfflinePDF offers its tools with no account required and no feature behind a paywall. No email
        or sign-up is needed to use any tool.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, the date above will be updated.</p>
    </article>
  );
}
