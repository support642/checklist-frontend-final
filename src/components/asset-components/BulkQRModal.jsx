import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

const BulkQRModal = ({ isOpen, onClose, products }) => {
    const qrContainerRef = useRef(null);

    if (!isOpen) return null;

    const baseUrl = window.location.origin;

    const generatePDF = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const qrSize = 50;
        const colGap = 10;
        const rowGap = 15;
        const cols = 3;
        const labelHeight = 12;

        const contentWidth = pageWidth - (2 * margin);
        const colWidth = (contentWidth - (cols - 1) * colGap) / cols;

        let currentRow = 0;
        let currentCol = 0;
        let yOffset = margin;

        // Title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Product QR Codes', pageWidth / 2, yOffset + 5, { align: 'center' });
        yOffset += 15;

        // Date
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, yOffset, { align: 'center' });
        yOffset += 15;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const productUrl = `${baseUrl}/product/${product.sn}`;

            // Calculate position
            const xPos = margin + currentCol * (colWidth + colGap);
            const centerX = xPos + colWidth / 2;

            // Check if we need a new page
            if (yOffset + qrSize + labelHeight + rowGap > pageHeight - margin) {
                pdf.addPage();
                yOffset = margin;
                currentRow = 0;
            }

            // Create a canvas for QR code
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 200;

            // Get QR code SVG and convert to canvas
            const qrElement = document.getElementById(`bulk-qr-${product.id}`);
            if (qrElement) {
                const svgData = new XMLSerializer().serializeToString(qrElement);
                const img = new Image();

                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, 200, 200);
                        ctx.drawImage(img, 0, 0, 200, 200);
                        resolve();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                });

                const imgData = canvas.toDataURL('image/png');

                // Draw QR code centered in column
                const qrX = centerX - qrSize / 2;
                pdf.addImage(imgData, 'PNG', qrX, yOffset, qrSize, qrSize);

                // Draw border
                pdf.setDrawColor(200, 200, 200);
                pdf.rect(qrX - 2, yOffset - 2, qrSize + 4, qrSize + 4);

                // Draw serial number
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.text(product.sn, centerX, yOffset + qrSize + 5, { align: 'center' });

                // Draw product name (truncated)
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                const maxWidth = colWidth - 5;
                let productName = product.productName;
                if (pdf.getTextWidth(productName) > maxWidth) {
                    while (pdf.getTextWidth(productName + '...') > maxWidth && productName.length > 0) {
                        productName = productName.slice(0, -1);
                    }
                    productName += '...';
                }
                pdf.text(productName, centerX, yOffset + qrSize + 10, { align: 'center' });

                // Draw URL
                pdf.setFontSize(6);
                pdf.setTextColor(100);
                let urlText = productUrl;
                if (pdf.getTextWidth(urlText) > maxWidth) {
                    while (pdf.getTextWidth(urlText + '...') > maxWidth && urlText.length > 0) {
                        urlText = urlText.slice(0, -1);
                    }
                    urlText += '...';
                }
                pdf.text(urlText, centerX, yOffset + qrSize + 14, { align: 'center' });
                pdf.setTextColor(0); // Reset color
            }

            // Move to next position
            currentCol++;
            if (currentCol >= cols) {
                currentCol = 0;
                currentRow++;
                yOffset += qrSize + labelHeight + rowGap;
            }
        }

        // Add footer on last page
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Total: ${products.length} products`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save the PDF
        pdf.save('product-qr-codes.pdf');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <FileText size={24} />
                        <div>
                            <h2 className="text-lg font-bold">All Product QR Codes</h2>
                            <p className="text-white/80 text-sm">{products.length} products</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-2">
                        <X size={24} />
                    </button>
                </div>

                {/* QR Codes Grid */}
                <div ref={qrContainerRef} className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                <QRCodeSVG
                                    id={`bulk-qr-${product.id}`}
                                    value={`${baseUrl}/product/${product.sn}`}
                                    size={120}
                                    level="M"
                                    includeMargin={true}
                                    className="mx-auto"
                                />
                                <p className="font-bold text-blue-600 text-sm mt-2">{product.sn}</p>
                                <p className="text-slate-600 text-xs truncate">{product.productName}</p>
                                <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 rounded p-1">
                                    <span className="font-semibold block">Scan URL:</span>
                                    <span className="break-all">{`${baseUrl}/product/${product.sn}`}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <button
                        onClick={generatePDF}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors"
                    >
                        <Download size={20} />
                        Download All QR Codes as PDF
                    </button>
                    <p className="text-xs text-slate-500 text-center mt-2">
                        PDF will have 3 QR codes per row
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BulkQRModal;
