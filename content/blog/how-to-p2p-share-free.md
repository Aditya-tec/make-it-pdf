---
title: "How to Send a File Directly to Another Device Free"
excerpt: "Share a file browser-to-browser with a link or QR code. No upload, no account."
relatedTools: ["p2p-share","encrypt-pdf","whiteboard"]
---

## What happens

You pick a file and get a link. The other person opens it, and the file goes straight from your browser to theirs. Keep your tab open until it finishes.

## What does touch the network

This tool is an exception to "nothing leaves your device". To connect the two browsers it contacts the public PeerJS service and Google's public STUN servers. They can see IP addresses and a random room ID, not the file or its name.

## Limits

- One receiver per link.
- Anyone with the link before your friend can receive the file.
- If the connection drops, the transfer stops and nothing is saved.
- The file is held in memory on the receiving side, so size is capped.

## Tip

Encrypt sensitive PDFs first with **Encrypt PDF**.
