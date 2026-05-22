# Implementation Plan - Build Public Detail Page, Modal PDF Viewer & Ephemera Strip

### [x] Step: Update Card Link
- Modify `./src/components/LetterheadCard.tsx` to link to `/archive/[slug]`

### [x] Step: Implement Embedded PDF Viewer
- Build a lightweight React component `./src/components/PdfViewerModal.tsx` using `pdfjs-dist` to render pages of a PDF inside a modal canvas.
- Implement pagination (prev, next) and zoom controls.

### [x] Step: Implement Lightbox & Ephemera Strip
- Build a client component `./src/components/DetailClient.tsx` or similar to handle the ephemera horizontal strip and lightbox.
- Support images, PDFs (using the PDF viewer modal), and audio files (inline audio player with simple waveform preview).

### [x] Step: Develop Dynamic Detail Page
- Create the App Router dynamic page at `./src/app/archive/[slug]/page.tsx`.
- Display the WebP thumbnail.
- Build definition list for all metadata.
- Implement the "Download PDF" button.
- Integrate the Ephemera Strip and Lightbox.
- Fetch and display the recommended gallery strips ("More from Company", "More from Era").

### [x] Step: Verification & Cleanup
- Run typescript compilation and ESLint to check for compile-time errors.
- Ensure proper responsive styling.
