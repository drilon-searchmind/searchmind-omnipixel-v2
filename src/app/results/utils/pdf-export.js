/**
 * Export results to PDF
 */
export async function exportToPDF(displayResults) {
    // Dynamically import libraries (client-side only)
    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');

    // Get the main content container (exclude sidebar)
    const mainContent = document.querySelector('.flex-1.min-w-0') ||
        document.querySelector('.results-content-container .flex-1') ||
        document.querySelector('.results-content-container');

    if (!mainContent) {
        throw new Error('Could not find content element to export');
    }

    // Generate filename from URL
    const urlSlug = displayResults.url
        ?.replace(/https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/\//g, '-')
        .substring(0, 50) || 'report';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `omnipixel-report-${urlSlug}-${dateStr}.pdf`;

    // Store original styles to restore later
    const elementsToHide = [];

    // Hide sidebar TOC
    const sidebarTOC = document.querySelector('.hidden.lg\\:block');
    if (sidebarTOC) {
        elementsToHide.push({
            element: sidebarTOC,
            originalDisplay: sidebarTOC.style.display
        });
        sidebarTOC.style.display = 'none';
    }

    // Hide mobile TOC button
    const mobileTOCButton = document.querySelector('.lg\\:hidden');
    if (mobileTOCButton && mobileTOCButton.closest('.flex.flex-wrap')) {
        elementsToHide.push({
            element: mobileTOCButton,
            originalDisplay: mobileTOCButton.style.display
        });
        mobileTOCButton.style.display = 'none';
    }

    // Hide action buttons (New Scan, Re-scan, Export) for cleaner PDF
    const actionButtons = document.querySelectorAll('.flex.flex-wrap.items-center.gap-3 button');
    actionButtons.forEach(btn => {
        if (btn.textContent?.includes('New Scan') ||
            btn.textContent?.includes('Re-scan') ||
            btn.textContent?.includes('Export')) {
            elementsToHide.push({
                element: btn,
                originalDisplay: btn.style.display
            });
            btn.style.display = 'none';
        }
    });

    // Scroll to top to ensure full content is captured
    window.scrollTo(0, 0);

    // Wait for DOM updates and scroll
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert HTML to canvas using html2canvas-pro
    const canvas = await html2canvas(mainContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: mainContent.scrollWidth,
        windowHeight: mainContent.scrollHeight,
        allowTaint: false,
        removeContainer: false
    });

    // Calculate PDF dimensions with padding
    const padding = 17;
    const pageWidth = 210;
    const pageHeight = 297;
    const availableWidth = pageWidth - (padding * 2);
    const availableHeight = pageHeight - (padding * 2);
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = padding;
    let heightLeft = imgHeight;

    // Calculate pixels per mm for slicing
    const pixelsPerMM = canvas.height / imgHeight;
    const pixelsPerPage = availableHeight * pixelsPerMM;
    let sourceY = 0;

    // Add pages until all content is rendered
    while (sourceY < canvas.height) {
        const remainingPixels = canvas.height - sourceY;
        const pagePixels = Math.min(pixelsPerPage, remainingPixels);
        const pageDisplayHeight = pagePixels / pixelsPerMM;

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pagePixels;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sourceY, canvas.width, pagePixels, 0, 0, canvas.width, pagePixels);

        // Add image slice to PDF with padding
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', padding, yPosition, imgWidth, pageDisplayHeight);

        // Move to next page if there's more content
        sourceY += pagePixels;
        if (sourceY < canvas.height) {
            pdf.addPage();
            yPosition = padding;
        }
    }

    // Save PDF
    pdf.save(filename);

    // Restore all hidden elements
    elementsToHide.forEach(({ element, originalDisplay }) => {
        if (element && originalDisplay !== undefined) {
            element.style.display = originalDisplay;
        } else if (element) {
            element.style.display = '';
        }
    });

    console.log('PDF exported successfully:', filename);
}
